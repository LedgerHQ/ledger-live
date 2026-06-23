import type { MemberCredentials } from "../../src/types";

type Credentials = MemberCredentials & { trustchainId: string };

export async function readMemberCredentials(): Promise<Credentials> {
  const credentials = await readObjectFromStdin(
    'Paste JSON credentials (multi-line ok) { "trustchainId": "...", "pubkey": "...", "privatekey": "..." }:\n> ',
  );
  validateMemberCredentials(credentials);
  return credentials;
}

function validateMemberCredentials(credentials: unknown): asserts credentials is Credentials {
  if (typeof credentials !== "object" || credentials === null) {
    throw new TypeError("Credentials must be a JSON object");
  }
  const { trustchainId, pubkey, privatekey } = credentials as Record<string, unknown>;
  if (
    typeof trustchainId !== "string" ||
    typeof pubkey !== "string" ||
    typeof privatekey !== "string"
  ) {
    throw new TypeError(
      'Credentials must contain string "trustchainId", "pubkey" and "privatekey"',
    );
  }
  if (pubkey.length !== 66) {
    // LKRP public keys have a 1 byte prefix, so 33 bytes = 66 hex chars.
    throw new RangeError(`Expected pubkey to be 66 hex chars, got ${pubkey.length}`);
  }
  if (privatekey.length !== 64) {
    throw new RangeError(`Expected privatekey to be 64 hex chars, got ${privatekey.length}`);
  }
  console.log("[CHECK] Received valid member credentials!");
}

async function readObjectFromStdin(prompt: string): Promise<unknown> {
  process.stdout.write(prompt);
  process.stdin.setEncoding("utf8");
  process.stdin.resume();

  let buffer = "";
  for await (const chunk of process.stdin) {
    buffer += chunk;
    try {
      const obj = JSON.parse(buffer.trim());
      process.stdout.write("\n");
      return obj;
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e;
    }
  }
  throw new Error("stdin closed before a complete JSON object was provided");
}
