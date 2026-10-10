import { resolveAccountDescriptorV1 } from "../commands/inputs";
import { parseEvmAddress } from "./evm";

/** Only Ethereum mainnet accounts can propose an intent: that's the one network Agent Intent
 * supports in wallet-cli. */
export async function resolveSenderFromAccount(
  label: string,
  intentType: "send" | "swap",
): Promise<string> {
  const descriptor = await resolveAccountDescriptorV1(label);
  const { name, env } = descriptor.network;
  if (name !== "ethereum" || env !== "main" || descriptor.type !== "address") {
    const network = env === "main" ? name : `${name} ${env}`;
    throw new Error(
      `Account "${label}" is on ${network}; Agent Intent ${intentType} intents support Ethereum ` +
        "mainnet accounts only.",
    );
  }
  return parseEvmAddress(descriptor.address, "account");
}
