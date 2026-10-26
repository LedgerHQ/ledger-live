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
  if (descriptor.network !== network || descriptor.type !== "address") {
    throw new Error(
      `Account "${label}" is on ${descriptor.network}; this Agent Intent ${intentType} needs ` +
        `${MAINNET_ACCOUNT[network]}.`,
    );
  }
  return network === "ethereum"
    ? parseEvmAddress(descriptor.address, "account")
    : descriptor.address;
}
