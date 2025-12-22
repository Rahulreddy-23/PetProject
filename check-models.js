const { GoogleGenerativeAI } = require("@google/generative-ai");

// Manually loading dotenv if needed, or relying on process.env if run via next's env context, 
// but for standalone script, better to paste key or assume env is set.
// User won't like me pasting their key in a file.
// I will try to read from .env.local if possible or just ask to run with env.
// For now, I'll assume I can access process.env if I run it properly, or I'll use a placeholder and ask user?
// No, I have access to read files. I can read .env.local myself to get the key for the script.

const fs = require('fs');
const path = require('path');

async function main() {
    try {
        let apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Try reading .env.local
            try {
                const envPath = path.resolve(process.cwd(), '.env.local');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
                    if (match) {
                        apiKey = match[1].trim();
                        // Remove quotes if present
                        if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                            apiKey = apiKey.slice(1, -1);
                        }
                    }
                }
            } catch (e) {
                console.error("Could not read .env.local", e);
            }
        }

        if (!apiKey) {
            console.error("No API Key found.");
            return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client? 
        // Actually SDK doesn't expose listModels directly on the main class in all versions?
        // In strict v1beta REST it's get /models.
        // The node SDK usually has a ModelManager? 
        // Let's check imports.
        // Actually, looking at docs, typically you don't list models via the simplified client often.
        // But let's try a simple fetch to the REST API using the key.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        } else {
            console.error("Failed to list models:", data);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
