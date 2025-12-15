import { CLI } from "./cliUtils";
import * as path from "path";
import * as fs from "fs";

/**
 * Creates Cardano accounts through the CLI and saves them to an app.json file
 * @param outputPath - Path to the output app.json file (default: userdata/cardano-accounts.json)
 * @param accountIndices - Array of account indices to create (default: [0, 1])
 * @returns Promise that resolves when accounts are created
 */
export async function createCardanoAccounts(
  outputPath?: string,
  accountIndices: number[] = [0, 1],
): Promise<void> {
  const defaultOutputPath = path.join(
    __dirname,
    "../userdata/cardano-accounts.json",
  );
  const appjsonPath = outputPath || defaultOutputPath;

  // Ensure the directory exists
  const dir = path.dirname(appjsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Initialize app.json if it doesn't exist
  if (!fs.existsSync(appjsonPath)) {
    const initialData = {
      data: {
        accounts: [],
      },
    };
    fs.writeFileSync(appjsonPath, JSON.stringify(initialData, null, 2));
  }

  console.log(`Creating Cardano accounts at indices: ${accountIndices.join(", ")}`);
  console.log(`Output file: ${appjsonPath}`);

  // Create accounts sequentially
  for (const index of accountIndices) {
    try {
      console.log(`Creating Cardano account at index ${index}...`);
      const result = await CLI.liveData({
        currency: "cardano",
        index: index,
        add: true,
        appjson: appjsonPath,
      });
      console.log(`✅ Account at index ${index} created successfully`);
      if (result) {
        console.log(result);
      }
    } catch (error) {
      console.error(`❌ Failed to create account at index ${index}:`, error);
      throw error;
    }
  }

  console.log(`\n✅ Successfully created ${accountIndices.length} Cardano account(s)`);
  console.log(`Accounts saved to: ${appjsonPath}`);
}

// If run directly as a script
if (require.main === module) {
  const args = process.argv.slice(2);
  const outputPath = args[0] || undefined;
  const indices = args[1]
    ? args[1].split(",").map((i) => parseInt(i.trim(), 10))
    : [0, 1];

  createCardanoAccounts(outputPath, indices)
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}




