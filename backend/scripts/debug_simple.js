
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../.env');

console.log("Checking .env file...");

try {
    if (fs.existsSync(envPath)) {
        console.log(".env file exists.");
        const content = fs.readFileSync(envPath, 'utf8');
        if (content.includes("BLOCKCHAIN_PRIVATE_KEY")) {
            console.log("BLOCKCHAIN_PRIVATE_KEY found in .env");
            const match = content.match(/BLOCKCHAIN_PRIVATE_KEY=(.+)/);
            if (match && match[1] && match[1].length > 10) {
                console.log("BLOCKCHAIN_PRIVATE_KEY appears valid.");
            } else {
                console.log("BLOCKCHAIN_PRIVATE_KEY appears empty or short.");
            }
        } else {
            console.log("BLOCKCHAIN_PRIVATE_KEY NOT found in .env");
        }

        if (content.includes("DATABASE_URL")) {
            console.log("DATABASE_URL found in .env");
            // Check for password in connection string pattern postgres://user:pass@host
            const urlMatch = content.match(/DATABASE_URL=(.+)/);
            if (urlMatch && urlMatch[1]) {
                const url = urlMatch[1].trim();
                console.log(`DATABASE_URL starts with: ${url.substring(0, 15)}...`);

                // varied heuristic to check for password presence without logging it
                if (url.includes("@")) {
                    const parts = url.split("@")[0]; // postgres://user:pass
                    if (parts.includes(":")) {
                        const pass = parts.split(":").pop();
                        if (pass && pass.length > 0) {
                            console.log("DATABASE_URL appears to contain a password.");
                            if (pass.startsWith('"') || pass.startsWith("'")) {
                                console.log("WARNING: Password appears to be quoted inside the URL. This might be the issue.");
                            }
                        } else {
                            console.log("WARNING: DATABASE_URL appears to be missing a password (empty after colon).");
                        }
                    } else {
                        console.log("WARNING: DATABASE_URL appears to be missing a password (no colon before @).");
                    }
                } else {
                    console.log("WARNING: DATABASE_URL does not contain '@' symbol.");
                }
            }
        } else {
            console.log("DATABASE_URL NOT found in .env");
        }
    } else {
        console.log(".env file does NOT exist.");
    }
} catch (e) {
    console.error("Error reading .env:", e.message);
}
