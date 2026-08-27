import Transport from "@ledgerhq/hw-transport";
import { createFrameworkSigner, type CasperFrameworkSigner } from "@ledgerhq/coin-casper/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";
import { createDeviceSigner } from "./deviceSigner";

export const createSigner: CreateSigner<CasperFrameworkSigner> = (transport: Transport) =>
  createFrameworkSigner(createDeviceSigner(transport));

export const casperGetAddress = (
  signerContext: SignerContext<CasperFrameworkSigner>,
): GetAddressFn => {
  return (deviceId, { path, verify }) =>
    signerContext(deviceId, signer => signer.getAddress(path, { verify }));
};

const context = executeWithSigner(createSigner);
const getAddress = casperGetAddress(context);

export default {
  context,
  getAddress,
} satisfies CoinFrameworkSigner;
