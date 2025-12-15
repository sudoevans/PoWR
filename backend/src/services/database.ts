import Database from "better-sqlite3";
import path from "path";
import { Artifact } from "./artifactIngestion";
import { PoWProfile } from "./scoringEngine";

const dbPath = path.join(process.cwd(), "data", "powr.db");

// Ensure data directory exists
import fs from "fs";
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    github_id INTEGER,
    access_token_encrypted TEXT,
    last_updated DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    username TEXT,
    type TEXT,
    data TEXT,
    timestamp TEXT,
    repository_owner TEXT,
    repository_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    username TEXT PRIMARY KEY,
    profile_data TEXT,
    artifacts_count INTEGER,
    last_analyzed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS blockchain_proofs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    transaction_hash TEXT UNIQUE,
    artifact_hash TEXT,
    block_number INTEGER,
    timestamp INTEGER,
    skill_scores TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    username TEXT PRIMARY KEY,
    plan_type TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    payment_address TEXT,
    last_payment_tx_hash TEXT,
    next_update_date DATETIME,
    webhook_secret TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (username) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS update_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    scheduled_date DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    plan_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
  );

  CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    amount TEXT NOT NULL,
    currency TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    block_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
  );

  CREATE INDEX IF NOT EXISTS idx_artifacts_username ON artifacts(username);
  CREATE INDEX IF NOT EXISTS idx_artifacts_timestamp ON artifacts(timestamp);
  CREATE INDEX IF NOT EXISTS idx_proofs_username ON blockchain_proofs(username);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
  CREATE INDEX IF NOT EXISTS idx_update_schedule_date ON update_schedule(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_payment_tx_hash ON payment_transactions(tx_hash);
`);

export class DatabaseService {
  // User management
  upsertUser(username: string, githubId: number, accessToken?: string) {
    const stmt = db.prepare(`
      INSERT INTO users (username, github_id, access_token_encrypted, last_updated)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        github_id = excluded.github_id,
        access_token_encrypted = COALESCE(excluded.access_token_encrypted, access_token_encrypted),
        last_updated = CURRENT_TIMESTAMP
    `);
    // In production, encrypt the token
    stmt.run(username, githubId, accessToken || null);
  }

  getUser(username: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    return stmt.get(username) as any;
  }

  // Artifact management
  saveArtifacts(username: string, artifacts: Artifact[]) {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO artifacts 
      (id, username, type, data, timestamp, repository_owner, repository_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((artifacts: Artifact[]) => {
      // Delete old artifacts for this user
      db.prepare("DELETE FROM artifacts WHERE username = ?").run(username);
      
      // Insert new artifacts
      for (const artifact of artifacts) {
        insert.run(
          artifact.id,
          username,
          artifact.type,
          JSON.stringify(artifact.data),
          artifact.timestamp,
          artifact.repository?.owner || null,
          artifact.repository?.name || null
        );
      }
    });

    transaction(artifacts);
  }

  getArtifacts(username: string, since?: Date): Artifact[] {
    let query = "SELECT * FROM artifacts WHERE username = ?";
    const params: any[] = [username];

    if (since) {
      query += " AND timestamp >= ?";
      params.push(since.toISOString());
    }

    query += " ORDER BY timestamp DESC";

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      type: row.type as "repo" | "commit" | "pull_request",
      id: row.id,
      data: JSON.parse(row.data),
      timestamp: row.timestamp,
      repository: row.repository_owner && row.repository_name
        ? { owner: row.repository_owner, name: row.repository_name }
        : undefined,
    }));
  }

  // Profile management
  saveProfile(username: string, profile: PoWProfile, artifactsCount: number) {
    const stmt = db.prepare(`
      INSERT INTO profiles (username, profile_data, artifacts_count, last_analyzed, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        profile_data = excluded.profile_data,
        artifacts_count = excluded.artifacts_count,
        last_analyzed = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(username, JSON.stringify(profile), artifactsCount);
  }

  getProfile(username: string): PoWProfile | null {
    const stmt = db.prepare("SELECT * FROM profiles WHERE username = ?");
    const row = stmt.get(username) as any;
    if (!row) return null;
    return JSON.parse(row.profile_data);
  }

  shouldRefreshProfile(username: string, maxAgeHours: number = 24): boolean {
    const stmt = db.prepare(`
      SELECT last_analyzed FROM profiles WHERE username = ?
    `);
    const row = stmt.get(username) as any;
    if (!row || !row.last_analyzed) return true;

    const lastAnalyzed = new Date(row.last_analyzed);
    const now = new Date();
    const hoursSince = (now.getTime() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
    return hoursSince >= maxAgeHours;
  }

  // Blockchain proof management
  saveBlockchainProof(
    username: string,
    transactionHash: string,
    artifactHash: string,
    blockNumber: number,
    timestamp: number,
    skillScores: number[]
  ) {
    const stmt = db.prepare(`
      INSERT INTO blockchain_proofs 
      (username, transaction_hash, artifact_hash, block_number, timestamp, skill_scores)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      username,
      transactionHash,
      artifactHash,
      blockNumber,
      timestamp,
      JSON.stringify(skillScores)
    );
  }

  getBlockchainProofs(username: string): any[] {
    const stmt = db.prepare(`
      SELECT * FROM blockchain_proofs 
      WHERE username = ? 
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all(username) as any[];
    return rows.map((row) => ({
      id: row.id,
      transactionHash: row.transaction_hash,
      artifactHash: row.artifact_hash,
      blockNumber: row.block_number,
      timestamp: row.timestamp,
      skillScores: JSON.parse(row.skill_scores),
      createdAt: row.created_at,
    }));
  }

  getLatestBlockchainProof(username: string): any | null {
    const stmt = db.prepare(`
      SELECT * FROM blockchain_proofs 
      WHERE username = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    const row = stmt.get(username) as any;
    if (!row) return null;
    return {
      id: row.id,
      transactionHash: row.transaction_hash,
      artifactHash: row.artifact_hash,
      blockNumber: row.block_number,
      timestamp: row.timestamp,
      skillScores: JSON.parse(row.skill_scores),
      createdAt: row.created_at,
    };
  }

  // Subscription management
  getSubscription(username: string): any | null {
    const stmt = db.prepare("SELECT * FROM subscriptions WHERE username = ?");
    const row = stmt.get(username) as any;
    if (!row) {
      // Create free plan by default
      this.createSubscription(username, 'free');
      return this.getSubscription(username);
    }
    return {
      username: row.username,
      planType: row.plan_type,
      status: row.status,
      paymentAddress: row.payment_address,
      lastPaymentTxHash: row.last_payment_tx_hash,
      nextUpdateDate: row.next_update_date,
      webhookSecret: row.webhook_secret,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    };
  }

  createSubscription(username: string, planType: string, paymentAddress?: string, txHash?: string) {
    const expiresAt = planType === 'free' ? null : this.calculateExpiryDate(planType);
    const stmt = db.prepare(`
      INSERT INTO subscriptions (username, plan_type, status, payment_address, last_payment_tx_hash, expires_at, created_at, updated_at)
      VALUES (?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        plan_type = excluded.plan_type,
        status = 'active',
        payment_address = COALESCE(excluded.payment_address, payment_address),
        last_payment_tx_hash = COALESCE(excluded.last_payment_tx_hash, last_payment_tx_hash),
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(username, planType, paymentAddress || null, txHash || null, expiresAt);
  }

  updateSubscription(username: string, updates: {
    planType?: string;
    status?: string;
    nextUpdateDate?: Date;
    webhookSecret?: string;
    expiresAt?: Date;
  }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.planType) {
      fields.push('plan_type = ?');
      values.push(updates.planType);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.nextUpdateDate) {
      fields.push('next_update_date = ?');
      values.push(updates.nextUpdateDate.toISOString());
    }
    if (updates.webhookSecret !== undefined) {
      fields.push('webhook_secret = ?');
      values.push(updates.webhookSecret);
    }
    if (updates.expiresAt !== undefined) {
      fields.push('expires_at = ?');
      values.push(updates.expiresAt ? updates.expiresAt.toISOString() : null);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(username);

    const stmt = db.prepare(`
      UPDATE subscriptions 
      SET ${fields.join(', ')}
      WHERE username = ?
    `);
    stmt.run(...values);
  }

  cancelSubscription(username: string) {
    const stmt = db.prepare(`
      UPDATE subscriptions 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `);
    stmt.run(username);
  }

  private calculateExpiryDate(planType: string): string {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + 1); // 1 month from now
    return expiry.toISOString();
  }

  // Update schedule management
  scheduleUpdate(username: string, scheduledDate: Date, planType: string) {
    const stmt = db.prepare(`
      INSERT INTO update_schedule (username, scheduled_date, status, plan_type)
      VALUES (?, ?, 'pending', ?)
    `);
    stmt.run(username, scheduledDate.toISOString(), planType);
  }

  getScheduledUpdates(beforeDate?: Date): any[] {
    let query = "SELECT * FROM update_schedule WHERE status = 'pending'";
    const params: any[] = [];

    if (beforeDate) {
      query += " AND scheduled_date <= ?";
      params.push(beforeDate.toISOString());
    }

    query += " ORDER BY scheduled_date ASC";

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      scheduledDate: row.scheduled_date,
      status: row.status,
      planType: row.plan_type,
      createdAt: row.created_at,
    }));
  }

  markScheduledUpdateComplete(id: number) {
    const stmt = db.prepare(`
      UPDATE update_schedule 
      SET status = 'completed'
      WHERE id = ?
    `);
    stmt.run(id);
  }

  markScheduledUpdateFailed(id: number) {
    const stmt = db.prepare(`
      UPDATE update_schedule 
      SET status = 'failed'
      WHERE id = ?
    `);
    stmt.run(id);
  }

  // Payment transaction management
  savePaymentTransaction(
    username: string,
    txHash: string,
    amount: string,
    currency: string,
    planType: string,
    blockNumber?: number
  ) {
    const stmt = db.prepare(`
      INSERT INTO payment_transactions 
      (username, tx_hash, amount, currency, plan_type, status, block_number)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `);
    stmt.run(username, txHash, amount, currency, planType, blockNumber || null);
  }

  updatePaymentTransactionStatus(txHash: string, status: string, blockNumber?: number) {
    const stmt = db.prepare(`
      UPDATE payment_transactions 
      SET status = ?, block_number = COALESCE(?, block_number)
      WHERE tx_hash = ?
    `);
    stmt.run(status, blockNumber || null, txHash);
  }

  getPaymentTransaction(txHash: string): any | null {
    const stmt = db.prepare("SELECT * FROM payment_transactions WHERE tx_hash = ?");
    const row = stmt.get(txHash) as any;
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      txHash: row.tx_hash,
      amount: row.amount,
      currency: row.currency,
      planType: row.plan_type,
      status: row.status,
      blockNumber: row.block_number,
      createdAt: row.created_at,
    };
  }

  getPaymentTransactions(username: string): any[] {
    const stmt = db.prepare(`
      SELECT * FROM payment_transactions 
      WHERE username = ? 
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(username) as any[];
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      txHash: row.tx_hash,
      amount: row.amount,
      currency: row.currency,
      planType: row.plan_type,
      status: row.status,
      blockNumber: row.block_number,
      createdAt: row.created_at,
    }));
  }
}

export const dbService = new DatabaseService();

