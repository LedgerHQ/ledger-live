import type Transport from "@ledgerhq/hw-transport";
import { createFrameworkSigner, type HederaFrameworkSigner } from "@ledgerhq/coin-hedera/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { executeWithSigner, type CreateSigner } from "../../bridge/setup";
import { createSigner as createHederaSigner } from "./setup";

export const createSigner: CreateSigner<HederaFrameworkSigner> = (transport: Transport) =>
  createFrameworkSigner(createHederaSigner(transport));

export const hederaGetAddress =
  (ctx: SignerContext<HederaFrameworkSigner>): GetAddressFn =>
  (deviceId, { path }) =>
    ctx(deviceId, signer => signer.getAddress(path));

const context = executeWithSigner(createSigner);

export default {
  context,
  getAddress: hederaGetAddress(context),
} satisfies CoinFrameworkSigner;
