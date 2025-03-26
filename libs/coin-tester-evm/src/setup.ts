import { config } from "dotenv";
import { resolve } from "path";

console.log("🔧 Setting up test environment...");
const envPath = resolve(__dirname, "../.env");
console.log(`📄 Loading .env file from: ${envPath}`);

const result = config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
} else {
  console.log("✅ Environment variables loaded successfully");
  console.log("🔍 Checking required variables:");
  const requiredVars = ["SEED", "SPECULOS_API_PORT", "GH_TOKEN"];
  requiredVars.forEach(varName => {
    console.log(`  ${process.env[varName] ? "✅" : "❌"} ${varName}`);
  });
}
