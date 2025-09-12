import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

let execa;

const info = str => {
  console.log(chalk.blue(str));
};

async function azureSign(filePath) {
  const { AZURE_APP_ID, AZURE_SECRET, AZURE_KEY_NAME } = process.env;

  if (!AZURE_APP_ID || !AZURE_SECRET || !AZURE_KEY_NAME) {
    throw new Error(
      "AZURE_APP_ID, AZURE_SECRET and AZURE_KEY_NAME env variables are required for signing Windows builds.",
    );
  }

  const { execa: execaFn } = await import("execa");
  execa = execaFn;

  info(`Signing ${filePath}`);

  const args = [
    "sign",
    "-du",
    "Ledger SAS",
    "-kvu",
    "https://ledgerlivevault.vault.azure.net",
    "-kvi",
    AZURE_APP_ID,
    "-kvs",
    AZURE_SECRET,
    "-kvc",
    AZURE_KEY_NAME,
    "-v",
    "-tr",
    "http://timestamp.digicert.com",
    filePath,
  ];

  await execa("azuresigntool", args, { stdio: "inherit" });
}

async function signWindows(context) {
  // Skip signing in CI or when explicitly disabled
  if (process.env.SKIP_SIGNING === "true") {
    info("Windows signing skipped (SKIP_SIGNING=true)");
    return;
  }

  const filePath = context.path;
  await azureSign(filePath);
}

export default signWindows;
