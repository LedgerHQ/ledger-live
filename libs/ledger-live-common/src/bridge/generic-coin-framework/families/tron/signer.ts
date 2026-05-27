import type Transport from "@ledgerhq/hw-transport";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../types";
import { CreateSigner, executeWithSigner } from "../../../setup";

export type TronFrameworkSigner = {
  getAddress: (
    path: string,
    opts?: { verify?: boolean; derivationMode?: string },
  ) => Promise<{ address: string; publicKey: string; path?: string }>;
  signTransaction: (
    path: string,
    rawTxHex: string,
    opts?: { derivationMode?: string },
  ) => Promise<string>;
};

export const createSigner: CreateSigner<TronFrameworkSigner> = (_transport: Transport) => {
  throw new Error(
    "Production Tron framework signer is not wired yet — pass a customSigner instead.",
  );
};

export const tronGetAddress = (signerContext: SignerContext<TronFrameworkSigner>): GetAddressFn => {
  return async (deviceId, { path, verify, derivationMode }) => {
    const r = await signerContext(deviceId, signer =>
      signer.getAddress(path, { verify, derivationMode }),
    );
    return { address: r.address, publicKey: r.publicKey, path };
  };
};

const context = executeWithSigner(createSigner);
const getAddress = tronGetAddress(context);

export default {
  context,
  getAddress,
} satisfies CoinFrameworkSigner;
