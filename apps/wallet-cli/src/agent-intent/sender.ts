import { resolveAccountDescriptorV1 } from "../commands/inputs";
import { parseEvmAddress } from "./evm";

const MAINNET_ACCOUNT = {
  ethereum: "an Ethereum mainnet account",
  solana: "a Solana mainnet account",
};

/** Only a mainnet address account on the intent's network can propose it. */
export async function resolveSenderFromAccount(
  label: string,
  intentType: "send" | "swap",
  network: keyof typeof MAINNET_ACCOUNT,
): Promise<string> {
  const descriptor = await resolveAccountDescriptorV1(label);
  const { name, env } = descriptor.network;
  if (name !== network || env !== "main" || descriptor.type !== "address") {
    const actual = env === "main" ? name : `${name} ${env}`;
    throw new Error(
      `Account "${label}" is on ${actual}; this Agent Intent ${intentType} needs ` +
        `${MAINNET_ACCOUNT[network]}.`,
    );
  }
  return network === "ethereum"
    ? parseEvmAddress(descriptor.address, "account")
    : descriptor.address;
}
