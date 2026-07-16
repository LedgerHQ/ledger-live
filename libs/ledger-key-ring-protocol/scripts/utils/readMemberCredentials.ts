import { createECDH } from "node:crypto";
import type { MemberCredentials } from "../../src/types";

type Credentials = MemberCredentials & { trustchainId?: string };

export async function readMemberCredentials(): Promise<Credentials> {
  const credentials = await readObjectFromStdin(
    [
      'Paste JSON credentials (multi-line ok) { "trustchainId": "...", "privatekey": "..." }:',
      "(all fields are optional enter {} to continue)",
      "> ",
    ].join("\n"),
  );
  return getCredentials(credentials);
}

function getCredentials(input: unknown): Credentials {
  const _input =
    typeof input !== "object" || input === null ? {} : (input as Record<string, string>);

  const trustchainId = _input.trustchainId;
  const { pubkey, privatekey } = getKeyPair(_input.privatekey);
  return { trustchainId, pubkey, privatekey };
}

function getKeyPair(privatekey?: string): MemberCredentials {
  const ecdh = createECDH("secp256k1");
  if (typeof privatekey === "string") {
    ecdh.setPrivateKey(Buffer.from(privatekey.replace(/^0x/, ""), "hex"));
  } else {
    ecdh.generateKeys();
  }
  return {
    pubkey: ecdh.getPublicKey("hex", "compressed"),
    privatekey: ecdh.getPrivateKey("hex"),
  };
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
