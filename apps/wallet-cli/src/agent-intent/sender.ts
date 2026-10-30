import { resolveAccountDescriptorV1 } from "../commands/inputs";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { parseEvmAddress } from "./evm";

const MAINNET_ACCOUNT = {
  ethereum: "an Ethereum mainnet account",
  solana: "a Solana mainnet account",
};

export type SenderAccount = { label: string; descriptor: AccountDescriptorV1 };

/** Exactly one sender: `--account` or the command's own address flag. */
export function parseSenderInput(
  flags: { account?: string; address?: string },
  addressFlag: "from" | "sender",
): { account: string } | { address: string } {
  if (flags.account && !flags.address) return { account: flags.account };
  if (flags.address && !flags.account) return { address: flags.address };
  throw new Error(
    `Pass exactly one sender: --account <session-label> or --${addressFlag} <address>.`,
  );
}

export async function resolveSenderAccount(label: string): Promise<SenderAccount> {
  return { label, descriptor: await resolveAccountDescriptorV1(label) };
}

/** Only a mainnet address account on the intent's network can propose it. */
export function senderFromAccount(
  { label, descriptor }: SenderAccount,
  intentType: "send" | "swap",
  network: keyof typeof MAINNET_ACCOUNT,
): string {
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
