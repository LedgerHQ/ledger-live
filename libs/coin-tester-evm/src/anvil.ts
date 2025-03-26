import chalk from "chalk";
import * as compose from "docker-compose";
import { killSpeculos } from "@ledgerhq/coin-tester/lib/signers/speculos";

const cwd = __dirname;
console.log("📂 Anvil working directory:", cwd);

const delay = (timing: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timing));

const ensureEnv = () => {
  console.log("🔍 Checking Anvil environment variables...");
  const mandatory_env_variables = ["SEED", "GH_TOKEN"];

  const missingVars = mandatory_env_variables.filter(variable => !process.env[variable]);
  if (missingVars.length > 0) {
    console.error("❌ Missing environment variables:", missingVars.join(", "));
    throw new Error(
      `Missing env variables. Make sure that ${mandatory_env_variables.join(",")} are in your .env`,
    );
  }
  console.log("✅ All required environment variables present");
};

export const spawnAnvil = async (rpc: string): Promise<void> => {
  console.log("\n🔄 Initializing Anvil...");
  console.log("🌐 Using RPC:", rpc);

  try {
    ensureEnv();
    console.log("🚀 Starting Anvil container...");
    await compose.upOne("anvil", {
      cwd,
      log: Boolean(process.env.DEBUG),
      env: {
        ...process.env,
        RPC: rpc,
      },
    });

    const checkAnvilLogs = async (): Promise<void> => {
      console.log("📋 Checking Anvil logs...");
      const { out } = await compose.logs("anvil", {
        cwd,
        env: {
          ...process.env,
          RPC: rpc,
        },
      });

      if (out.includes("Listening on 0.0.0.0:")) {
        console.log(chalk.bgBlueBright(" -  ANVIL READY ✅  - "));
        console.log("🎉 Anvil is running successfully!");
        return;
      }

      console.log("⏳ Waiting for Anvil to be ready...");
      await delay(200);
      return checkAnvilLogs();
    };

    await checkAnvilLogs();
  } catch (error) {
    console.error("❌ Failed to start Anvil:", error);
    throw error;
  }
};

export const killAnvil = async (): Promise<void> => {
  console.log("\n🛑 Stopping Anvil...");
  try {
    await compose.down({
      cwd,
      log: Boolean(process.env.DEBUG),
      env: process.env,
      commandOptions: ["--remove-orphans"],
    });
    console.log("✅ Anvil stopped successfully");
  } catch (error) {
    console.error("❌ Error stopping Anvil:", error);
    throw error;
  }
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    console.log(`\n🚨 Received ${e} signal - cleaning up...`);
    await Promise.all([killAnvil(), killSpeculos()]);
  }),
);
