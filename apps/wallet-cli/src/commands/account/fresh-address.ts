import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../../wallet";
import { parseV1, toV0, serializeNetwork } from "../../shared/accountDescriptor";
import { resolveAccountArg, OutputFormatSchema } from "../../wallet/models";
import { makeEnvelope } from "../../shared/response";
import { withSpinner, writeStdout } from "../../shared/ui";

export default defineCommand({
  name: "fresh-address",
  description: "Resolve the fresh receive address for an account descriptor (no device required)",
  options: {
    account: option(z.string().min(1).optional(), {
      description: "Account descriptor (V1 format), or pass as first positional arg",
      short: "a",
    }),
    output: option(OutputFormatSchema.default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags, positional }) => {
    const input = resolveAccountArg(flags.account, positional);
    const v1 = parseV1(input);
    const isHuman = flags.output === "human";
    const wallet = new WalletAdapter();
    // address-based (EVM, Solana…): no sync needed, address is in the descriptor
    // utxo (Bitcoin…): next unused address requires a blockchain scan
    const address =
      v1.type === "address"
        ? v1.address
        : await withSpinner(
            `Scanning ${v1.network.name} blockchain for fresh address…`,
            "Fresh address resolved",
            () => wallet.getFreshAddress(toV0(v1)),
            isHuman,
          );
    const network = serializeNetwork(v1.network);
    writeStdout(
      isHuman
        ? address
        : JSON.stringify(makeEnvelope("account fresh-address", network, { address }, input), null, 2),
    );
  },
});
