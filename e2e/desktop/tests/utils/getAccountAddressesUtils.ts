import { readFile } from "fs/promises";
import { join } from "path";

interface Operation {
  type?: string;
  recipients?: string[];
}

interface AccountData {
  freshAddress?: string;
  operations?: Operation[];
}

interface AppJson {
  data?: {
    accounts?: Array<{ data?: AccountData }>;
  };
}

async function parseAppJson(filePath: string): Promise<AppJson> {
  const raw = await readFile(filePath, "utf-8").catch(() => {
    throw new Error(`File not found: "${filePath}"`);
  });
  try {
    return JSON.parse(raw) as AppJson;
  } catch (e) {
    throw new Error(`Failed to parse "${filePath}": ${(e as Error).message}`);
  }
}

// Returns all addresses owned by an account: current receive address plus
// recipients of past IN operations (UTXO HD wallet — all used addresses remain valid).
function extractAddresses(account: AccountData): string[] {
  const inOpRecipients = (account.operations ?? [])
    .filter(op => op.type === "IN")
    .flatMap(op => op.recipients ?? []);

  return [account.freshAddress, ...inOpRecipients].filter(
    (addr): addr is string => typeof addr === "string",
  );
}

export async function getAccountAddressesFromAppJson(userDataDir: string): Promise<string[]> {
  if (!userDataDir.trim()) throw new Error("userDataDir must be a non-empty string");

  const filePath = join(userDataDir, "app.json");
  const { data } = await parseAppJson(filePath);
  const accounts = data?.accounts;

  if (!Array.isArray(accounts)) {
    throw new Error(`Invalid app.json at "${filePath}": "data.accounts" must be an array`);
  }

  const addresses = [...new Set(accounts.flatMap(a => (a.data ? extractAddresses(a.data) : [])))];

  if (addresses.length === 0) {
    throw new Error(`No valid account addresses found in "${filePath}"`);
  }

  return addresses;
}
