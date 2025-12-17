
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import fs from 'fs';

// 1. Load .env explicitly
const envPath = path.join(__dirname, '../.env');
console.log(`[Diagnostic] Loading .env from: ${envPath}`);

if (!fs.existsSync(envPath)) {
    console.error("❌ ERROR: .env file not found!");
    process.exit(1);
}

const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
    console.error("❌ ERROR: dotenv failed to parse .env:", envConfig.error);
    process.exit(1);
}

console.log("[Diagnostic] .env parsed successfully.");

// 2. Inspect DATABASE_URL
const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
    console.error("❌ ERROR: DATABASE_URL is missing in process.env");
    process.exit(1);
}

console.log(`[Diagnostic] DATABASE_URL length: ${rawUrl.length}`);

try {
    // 3. Parse URL
    // Use standard URL object to parse (postgres://user:pass@host...)
    const url = new URL(rawUrl);

    console.log(`[Diagnostic] Protocol: ${url.protocol}`); // Should be postgres: or postgresql:
    console.log(`[Diagnostic] Username: ${url.username}`);

    if (url.password) {
        console.log(`[Diagnostic] Password: YES (Length: ${url.password.length})`);
        // Check first/last chars to ensure no quote issues
        console.log(`[Diagnostic] Password starts/ends with quote: ${url.password.startsWith('"') || url.password.startsWith("'")}`);
    } else {
        console.error("❌ ERROR: Password is MISSING in the parsed URL.");
        console.error("   This confirms the 'SASL: client password must be a string' error.");
        console.error("   Please ensure the URL format is: postgres://user:password@host...");
    }

    console.log(`[Diagnostic] Host: ${url.hostname}`);
    console.log(`[Diagnostic] Database: ${url.pathname.substring(1)}`);

    // 4. Test Connection
    console.log("[Diagnostic] Attempting actual connection...");

    const pool = new Pool({
        connectionString: rawUrl,
        ssl: rawUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000, // 5s timeout
    });

    pool.connect()
        .then(client => {
            console.log("✅ SUCCESS: Connected to database!");
            return client.query('SELECT NOW()')
                .then(res => {
                    console.log(`[Diagnostic] Server time: ${res.rows[0].now}`);
                    client.release();
                    pool.end();
                    process.exit(0);
                });
        })
        .catch(err => {
            console.error("❌ ERROR: Connection failed:");
            console.error(err.message);
            if (err.message.includes("password")) {
                console.error("   -> This is an authentication issue.");
            }
            pool.end();
            process.exit(1);
        });

} catch (e: any) {
    console.error("❌ ERROR: Failed to parse DATABASE_URL:", e.message);
    process.exit(1);
}
