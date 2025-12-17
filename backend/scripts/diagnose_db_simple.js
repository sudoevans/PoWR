
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// We can't import 'pg' easily if it's not compiled or if we don't want to rely on node_modules resolution peculiarities
// So we'll limit this to pure env parsing diagnosis which is 99% likely the issue

const envPath = path.join(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const rawContent = fs.readFileSync(envPath, 'utf8');
    const config = dotenv.parse(rawContent);

    if (config.DATABASE_URL) {
        console.log("DATABASE_URL found.");
        try {
            const url = new URL(config.DATABASE_URL);
            console.log(`Protocol: ${url.protocol}`);
            if (url.password) {
                console.log(`Password Present: YES (Len: ${url.password.length})`);
                if (url.password.startsWith("'") || url.password.startsWith('"')) {
                    console.log("WARNING: Password looks quoted.");
                }
            } else {
                console.log("Password Present: NO (Empty string)");
                console.log("Please check if the URL format is postgres://user:pass@host...");
            }
        } catch (e) {
            console.log(`Error parsing URL: ${e.message}`);
        }
    } else {
        console.log("DATABASE_URL NOT found in dotenv parse result.");
    }
} else {
    console.log(".env file DOES NOT EXIST.");
}
