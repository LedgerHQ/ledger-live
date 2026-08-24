import getAddress from "@ledgerhq/coin-stacks/signer/index";
import type { StacksSigner } from "@ledgerhq/coin-stacks/types";
import { getPath, throwIfError } from "@ledgerhq/coin-stacks/utils";
import Transport from "@ledgerhq/hw-transport";
import BlockstackApp from "@zondax/ledger-stacks";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";

// AddressVersion.MainnetSingleSig, inlined: ledger-live-common has no direct dependency on
// @stacks/network to import the enum from.
const MAINNET_SINGLE_SIG_ADDRESS_VERSION = 22;

type StacksDeviceSigner = StacksSigner & {
  getAddress: (
    path: string,
    options?: { verify?: boolean },
  ) => Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction: (path: string, txHex: string) => Promise<string>;
};

// genericSignOperation calls .getAddress/.signTransaction directly on the raw device-signer
// instance, so both are added here on top of BlockstackApp's own methods (mirrors coin-vechain).
const createSignerStacks: CreateSigner<StacksDeviceSigner> = (transport: Transport) => {
  const blockstack = new BlockstackApp(transport);
  return Object.assign(blockstack, {
    getAddress: async (path: string, options?: { verify?: boolean }) => {
      const r = options?.verify
        ? await blockstack.showAddressAndPubKey(getPath(path), MAINNET_SINGLE_SIG_ADDRESS_VERSION)
        : await blockstack.getAddressAndPubKey(getPath(path), MAINNET_SINGLE_SIG_ADDRESS_VERSION);
      throwIfError(r);
      return { path, address: r.address, publicKey: r.publicKey.toString("hex") };
    },
    signTransaction: async (path: string, txHex: string) => {
      const r = await blockstack.sign(getPath(path), Buffer.from(txHex.replace(/^0x/, ""), "hex"));
      throwIfError(r);
      return r.signatureVRS.toString("hex");
    },
  });
};

export const context = executeWithSigner(createSignerStacks);

export default {
  context,
  getAddress: getAddress(context),
} satisfies CoinFrameworkSigner;
