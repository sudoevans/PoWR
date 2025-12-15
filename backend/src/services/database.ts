import { Pool } from "pg";
import { Artifact } from "./artifactIngestion";
import { PoWProfile } from "./scoringEngine";

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") 
    ? { rejectUnauthorized: false } 
    : false,
});

// Initialize tables on startup
async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        github_id INTEGER,
        access_token_encrypted TEXT,
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        username TEXT REFERENCES users(username),
        type TEXT,
        data JSONB,
        timestamp TEXT,
        repository_owner TEXT,
        repository_name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS profiles (
        username TEXT PRIMARY KEY REFERENCES users(username),
        profile_data JSONB,
        artifacts_count INTEGER,
        last_analyzed TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS blockchain_proofs (
        id SERIAL PRIMARY KEY,
        username TEXT REFERENCES users(username),
        transaction_hash TEXT UNIQUE,
        artifact_hash TEXT,
        block_number INTEGER,
        timestamp BIGINT,
        skill_scores JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        username TEXT PRIMARY KEY REFERENCES users(username),
        plan_type TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        payment_address TEXT,
        last_payment_tx_hash TEXT,
        next_update_date TIMESTAMP,
        webhook_secret TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS update_schedule (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username),
        scheduled_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        plan_type TEXT NOT NULL,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL REFERENCES users(username),
        tx_hash TEXT UNIQUE NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT NOT NULL,
        plan_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        block_number INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_artifacts_username ON artifacts(username);
      CREATE INDEX IF NOT EXISTS idx_artifacts_timestamp ON artifacts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_proofs_username ON blockchain_proofs(username);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_update_schedule_date ON update_schedule(scheduled_date);
    `);
    console.log("PostgreSQL tables initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PostgreSQL tables:", error);
  } finally {
    client.release();
  }
}

// Initialize tables when module loads
initializeTables();

export class DatabaseService {
  // User management
  async upsertUser(username: string, githubId: number, accessToken?: string) {
    await pool.query(`
      INSERT INTO users (username, github_id, access_token_encrypted, last_updated)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT(username) DO UPDATE SET
        github_id = COALESCE($2, users.github_id),
        access_token_encrypted = COALESCE($3, users.access_token_encrypted),
        last_updated = NOW()
    `, [username, githubId, accessToken]);
  }

  async getUser(username: string) {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    return result.rows[0] || null;
  }

  // Artifact management
  async saveArtifacts(username: string, artifacts: Artifact[]) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM artifacts WHERE username = $1", [username]);
      
      for (const artifact of artifacts) {
        await client.query(`
          INSERT INTO artifacts (id, username, type, data, timestamp, repository_owner, repository_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          artifact.id,
          username,
          artifact.type,
          JSON.stringify(artifact.data),
          artifact.timestamp,
          artifact.repository?.owner || null,
          artifact.repository?.name || null,
        ]);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getArtifacts(username: string, since?: Date): Promise<Artifact[]> {
    let query = "SELECT * FROM artifacts WHERE username = $1";
    const params: any[] = [username];

    if (since) {
      query += " AND timestamp >= $2";
      params.push(since.toISOString());
    }
    query += " ORDER BY timestamp DESC";

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      type: row.type as "repo" | "commit" | "pull_request",
      id: row.id,
      data: row.data,
      timestamp: row.timestamp,
      repository: row.repository_owner && row.repository_name
        ? { owner: row.repository_owner, name: row.repository_name }
        : undefined,
    }));
  }

  // Profile management
  async saveProfile(username: string, profile: PoWProfile, artifactsCount: number) {
    await pool.query(`
      INSERT INTO profiles (username, profile_data, artifacts_count, last_analyzed, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT(username) DO UPDATE SET
        profile_data = $2,
        artifacts_count = $3,
        last_analyzed = NOW(),
        updated_at = NOW()
    `, [username, JSON.stringify(profile), artifactsCount]);
  }

  async getProfile(username: string): Promise<PoWProfile | null> {
    const result = await pool.query(
      "SELECT * FROM profiles WHERE username = $1",
      [username]
    );
    if (!result.rows[0]) return null;
    return result.rows[0].profile_data;
  }

  async shouldRefreshProfile(username: string, maxAgeHours: number = 24): Promise<boolean> {
    const result = await pool.query(
      "SELECT last_analyzed FROM profiles WHERE username = $1",
      [username]
    );
    if (!result.rows[0]?.last_analyzed) return true;
    const lastAnalyzed = new Date(result.rows[0].last_analyzed);
    const hoursSince = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
    return hoursSince >= maxAgeHours;
  }

  // Blockchain proof management
  async saveBlockchainProof(
    username: string,
    transactionHash: string,
    artifactHash: string,
    blockNumber: number,
    timestamp: number,
    skillScores: number[]
  ) {
    await pool.query(`
      INSERT INTO blockchain_proofs (username, transaction_hash, artifact_hash, block_number, timestamp, skill_scores)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(transaction_hash) DO NOTHING
    `, [username, transactionHash, artifactHash, blockNumber, timestamp, JSON.stringify(skillScores)]);
  }

  async getBlockchainProofs(username: string): Promise<any[]> {
    const result = await pool.query(
      "SELECT * FROM blockchain_proofs WHERE username = $1 ORDER BY timestamp DESC",
      [username]
    );
    return result.rows.map((row) => ({
      id: row.id,
      transactionHash: row.transaction_hash,
      artifactHash: row.artifact_hash,
      blockNumber: row.block_number,
      timestamp: row.timestamp,
      skillScores: row.skill_scores,
      createdAt: row.created_at,
    }));
  }

  async getLatestBlockchainProof(username: string): Promise<any | null> {
    const result = await pool.query(
      "SELECT * FROM blockchain_proofs WHERE username = $1 ORDER BY timestamp DESC LIMIT 1",
      [username]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      transactionHash: row.transaction_hash,
      artifactHash: row.artifact_hash,
      blockNumber: row.block_number,
      timestamp: row.timestamp,
      skillScores: row.skill_scores,
      createdAt: row.created_at,
    };
  }

  // Subscription management
  async saveSubscription(username: string, subscription: any) {
    await pool.query(`
      INSERT INTO subscriptions (username, plan_type, status, payment_address, last_payment_tx_hash, next_update_date, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT(username) DO UPDATE SET
        plan_type = COALESCE($2, subscriptions.plan_type),
        status = COALESCE($3, subscriptions.status),
        payment_address = COALESCE($4, subscriptions.payment_address),
        last_payment_tx_hash = COALESCE($5, subscriptions.last_payment_tx_hash),
        next_update_date = COALESCE($6, subscriptions.next_update_date),
        updated_at = NOW()
    `, [
      username,
      subscription.plan_type || "free",
      subscription.status || "active",
      subscription.payment_address || null,
      subscription.last_payment_tx_hash || null,
      subscription.next_update_date || null,
    ]);
  }

  async createSubscription(username: string, planType: string, paymentAddress?: string, paymentTxHash?: string) {
    await this.saveSubscription(username, {
      plan_type: planType,
      status: "active",
      payment_address: paymentAddress,
      last_payment_tx_hash: paymentTxHash,
    });
  }

  async updateSubscription(username: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [username];
    let paramIndex = 2;

    if (updates.plan_type !== undefined) {
      fields.push(`plan_type = $${paramIndex++}`);
      values.push(updates.plan_type);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.nextUpdateDate !== undefined) {
      fields.push(`next_update_date = $${paramIndex++}`);
      values.push(updates.nextUpdateDate);
    }
    if (updates.payment_address !== undefined) {
      fields.push(`payment_address = $${paramIndex++}`);
      values.push(updates.payment_address);
    }
    fields.push("updated_at = NOW()");

    if (fields.length > 1) {
      await pool.query(
        `UPDATE subscriptions SET ${fields.join(", ")} WHERE username = $1`,
        values
      );
    }
  }

  async cancelSubscription(username: string) {
    await pool.query(
      "UPDATE subscriptions SET status = 'cancelled', updated_at = NOW() WHERE username = $1",
      [username]
    );
  }

  async getSubscription(username: string): Promise<any | null> {
    const result = await pool.query(
      "SELECT * FROM subscriptions WHERE username = $1",
      [username]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      username: row.username,
      planType: row.plan_type,
      status: row.status,
      paymentAddress: row.payment_address,
      lastPaymentTxHash: row.last_payment_tx_hash,
      nextUpdateDate: row.next_update_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateSubscriptionNextUpdate(username: string, nextUpdateDate: Date) {
    await pool.query(
      "UPDATE subscriptions SET next_update_date = $2, updated_at = NOW() WHERE username = $1",
      [username, nextUpdateDate]
    );
  }

  // Scheduled updates
  async scheduleUpdate(username: string, scheduledDate: Date, planType: string) {
    await pool.query(`
      INSERT INTO update_schedule (username, scheduled_date, status, plan_type)
      VALUES ($1, $2, 'pending', $3)
    `, [username, scheduledDate, planType]);
  }

  async getScheduledUpdates(beforeDate?: Date): Promise<any[]> {
    let query = "SELECT * FROM update_schedule WHERE status = 'pending'";
    const params: any[] = [];
    
    if (beforeDate) {
      query += " AND scheduled_date <= $1";
      params.push(beforeDate);
    }
    query += " ORDER BY scheduled_date ASC";

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      scheduledDate: row.scheduled_date,
      status: row.status,
      planType: row.plan_type,
    }));
  }

  async getPendingUpdates(): Promise<any[]> {
    return this.getScheduledUpdates(new Date());
  }

  async markUpdateComplete(id: number) {
    await pool.query(
      "UPDATE update_schedule SET status = 'completed' WHERE id = $1",
      [id]
    );
  }

  async markScheduledUpdateComplete(id: number) {
    await this.markUpdateComplete(id);
  }

  async markUpdateFailed(id: number, error: string) {
    await pool.query(
      "UPDATE update_schedule SET status = 'failed', error = $2 WHERE id = $1",
      [id, error]
    );
  }

  async markScheduledUpdateFailed(id: number, error?: string) {
    await this.markUpdateFailed(id, error || "Unknown error");
  }

  // Payment management
  async savePaymentTransaction(
    username: string,
    txHash: string,
    amount: string,
    currency: string,
    planType: string,
    blockNumber?: number
  ) {
    await pool.query(`
      INSERT INTO payment_transactions (username, tx_hash, amount, currency, plan_type, block_number, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      ON CONFLICT(tx_hash) DO NOTHING
    `, [username, txHash, amount, currency, planType, blockNumber || null]);
  }

  async getPaymentTransaction(txHash: string): Promise<any | null> {
    const result = await pool.query(
      "SELECT * FROM payment_transactions WHERE tx_hash = $1",
      [txHash]
    );
    return result.rows[0] || null;
  }

  async updatePaymentStatus(txHash: string, status: string, blockNumber?: number) {
    await pool.query(
      "UPDATE payment_transactions SET status = $2, block_number = COALESCE($3, block_number) WHERE tx_hash = $1",
      [txHash, status, blockNumber]
    );
  }

  async updatePaymentTransactionStatus(txHash: string, status: string, blockNumber?: number) {
    await this.updatePaymentStatus(txHash, status, blockNumber);
  }

  // Cleanup
  async cleanupOldArtifacts(olderThanDays: number) {
    await pool.query(
      "DELETE FROM artifacts WHERE created_at < NOW() - INTERVAL '$1 days'",
      [olderThanDays]
    );
  }

  async cleanupOldProofs(olderThanDays: number) {
    await pool.query(
      "DELETE FROM blockchain_proofs WHERE created_at < NOW() - INTERVAL '$1 days'",
      [olderThanDays]
    );
  }
}

export const dbService = new DatabaseService();
