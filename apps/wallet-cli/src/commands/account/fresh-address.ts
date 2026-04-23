import { defineCommand } from "@bunli/core";
import { WalletAdapter } from "../../wallet";
import { parseV1, toV0, serializeNetwork } from "../../shared/accountDescriptor";
import { resolveAccountArg } from "../../wallet/models";
import { createCommandOutput } from "../../output";
import { accountOption, outputOption } from "../shared-options";

export default defineCommand({
  name: "fresh-address",
  description: "Resolve the fresh receive address for an account descriptor (no device required)",
  options: {
    account: accountOption,
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const input = resolveAccountArg(flags.account, positional);
    const v1 = parseV1(input);
    const network = serializeNetwork(v1.network);
    const wallet = new WalletAdapter();
    const out = createCommandOutput(flags.output, {
      command: "account fresh-address",
      network,
      account: input,
    });

    await out.run(async () => {
      // address-based (EVM, Solana…): no sync needed, address is in the descriptor
      // utxo (Bitcoin…): next unused address requires a blockchain scan
      const address =
        v1.type === "address"
          ? v1.address
          : await out.withActivity(
              `Scanning ${v1.network.name} blockchain for fresh address…`,
              "Fresh address resolved",
              () => wallet.getFreshAddress(toV0(v1)),
            );
      out.address(address);
    });
  },
});
