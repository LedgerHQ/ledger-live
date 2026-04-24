import { defineCommand } from "@bunli/core";
import { WalletAdapter } from "../../wallet";
import { toV0, serializeNetwork, serializeV1 } from "../../shared/accountDescriptor";
import { createCommandOutput } from "../../output";
import { accountOption, outputOption, resolveAccountArg, resolveAccountDescriptorV1 } from "../inputs";

export default defineCommand({
  name: "fresh-address",
  description: "Resolve the fresh receive address for an account descriptor (no device required)",
  options: {
    account: accountOption,
    output: outputOption,
  },
  handler: async ({ flags, positional }) => {
    const ctx = { command: "account fresh-address", network: "", account: "" };
    const out = createCommandOutput(flags.output, ctx);
    const wallet = new WalletAdapter();


    await out.run(async () => {
      const v1 = await resolveAccountDescriptorV1(resolveAccountArg(flags.account, positional));
      ctx.network = serializeNetwork(v1.network);
      ctx.account = serializeV1(v1);

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
