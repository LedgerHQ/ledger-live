import tronResolver from "@ledgerhq/coin-tron/signer";
import Trx from "@ledgerhq/hw-app-trx";
import Transport from "@ledgerhq/hw-transport";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";

type TronFrameworkSigner = {
  getAddress(
    path: string,
    options?: boolean | { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(path: string, rawTxHex: string | Buffer, options?: unknown): Promise<string>;
};

const createSigner: CreateSigner<TronFrameworkSigner> = (transport: Transport) => {
  const trx = new Trx(transport);
  return {
    getAddress: async (path, options?) => {
      const display = typeof options === "boolean" ? options : !!options?.verify;
      const result = await trx.getAddress(path, display);
      return { ...result, path };
    },
    signTransaction: async (path, rawTxOrBuffer, _options?) => {
      const rawTxHex = Buffer.isBuffer(rawTxOrBuffer)
        ? rawTxOrBuffer.toString("hex")
        : rawTxOrBuffer;
      // TRC10 token signatures are not threaded through the generic framework path;
      // hardware signing of TRC10 transfers without a token approval descriptor is
      // intentional and mirrors what the coin-tester does for the generic path.
      return trx.signTransaction(path, rawTxHex, []);
    },
  };
};

const context = executeWithSigner(createSigner);

export default {
  context,
  // tronResolver expects SignerContext<TronSigner> (with .sign()), but it only calls
  // .getAddress() — the cast is safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAddress: tronResolver(context as any),
} satisfies CoinFrameworkSigner;
