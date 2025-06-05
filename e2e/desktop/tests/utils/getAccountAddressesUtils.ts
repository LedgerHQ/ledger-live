import fs from "fs/promises";
import path from "path";

interface AppJson {
  data?: {
    accounts?: Array<{ data?: { freshAddress?: string } }>;
  };
}

export async function getAccountAddressesFromAppJson(userDataDir: string): Promise<string[]> {
  if (userDataDir.trim() === "") {
    throw new Error("userDataDir must be a non-empty string");
  }

  const appJsonPath = path.join(userDataDir, "app.json");

  try {
    await fs.access(appJsonPath);
  } catch {
    throw new Error(`File not found: "${appJsonPath}"`);
  }

  const raw = await fs.readFile(appJsonPath, "utf-8");
  let parsed: AppJson;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to JSON.parse("${appJsonPath}"):\n${(e as Error).message}`);
  }

  if (!parsed.data) {
    throw new Error(`Invalid shape in "${appJsonPath}": missing "data" property`);
  }
  if (!Array.isArray(parsed.data.accounts)) {
    throw new Error(
      `Invalid shape in "${appJsonPath}": expected “data.accounts” to be an array, got:\n${JSON.stringify(
        parsed.data.accounts,
        null,
        2,
      )}`,
    );
  }

  const accounts = parsed.data.accounts as Array<{ data?: { freshAddress?: string } }>;
  const addresses = accounts
    .map(a => a.data?.freshAddress)
    .filter((a): a is string => typeof a === "string");

  if (addresses.length === 0) {
    throw new Error(`No valid account addresses found in "${appJsonPath}"`);
  }

  return addresses;
}
