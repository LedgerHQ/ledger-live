const chalk = require("chalk");

require("dotenv").config();

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

  await import("execa").then(mod => {
    execa = mod.execa;
  });

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
  const filePath = context.path;

  await azureSign(filePath);
}

exports.default = signWindows;
