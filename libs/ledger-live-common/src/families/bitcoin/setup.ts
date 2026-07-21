// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { firstValueFrom, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { Bridge } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import Btc from "@ledgerhq/hw-app-btc";
import { createBridges } from "@ledgerhq/coin-bitcoin/bridge/js";
import type { BitcoinSigner, SignerContext } from "@ledgerhq/coin-bitcoin/signer";
import bitcoinResolver from "@ledgerhq/coin-bitcoin/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-bitcoin/hw-signMessage";
import { BitcoinAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-bitcoin/types";
import { getChainAdapter } from "@ledgerhq/coin-bitcoin/chain-adapters/registry";
import { GetAddressOptions, Resolver } from "../../hw/getAddress/types";
import { withDevice } from "../../hw/deviceAccess";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getCurrencyConfiguration } from "../../config";
import { BitcoinConfigInfo } from "@ledgerhq/coin-bitcoin/config";
import { SignMessage } from "../../hw/signMessage/types";

const createSigner = (transport: Transport, currency: CryptoCurrency): BitcoinSigner => {
  const btc = new Btc({ transport, currency: currency.id });
  const adapter = getChainAdapter(currency.id);
  return adapter.createSigner?.(transport, currency, btc) ?? btc;
};

const signerContext: SignerContext = <T>(
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: BitcoinSigner) => Promise<T>,
): Promise<T> =>
  firstValueFrom(
    withDevice(deviceId)((transport: Transport) => from(fn(createSigner(transport, crypto)))),
  );

const getCurrencyConfig = (currencyId: string) => {
  return { info: getCurrencyConfiguration<BitcoinConfigInfo>(currencyId) };
};

const bridge: Bridge<Transaction, BitcoinAccount, TransactionStatus> = createBridges(
  signerContext,
  getCurrencyConfig,
);

export function createMessageSigner(): SignMessage {
  return (transport, account, messageData) => {
    const signerContext: SignerContext = (_, crypto, fn) => fn(createSigner(transport, crypto));
    return signMessage(signerContext)("", account, messageData);
  };
}

const messageSigner = {
  signMessage: createMessageSigner(),
};

const resolver: Resolver = (
  transport: Transport,
  addressOpt: GetAddressOptions,
): ReturnType<GetAddressFn> => {
  const signerContext: SignerContext = (_, crypto, fn) => fn(createSigner(transport, crypto));
  return bitcoinResolver(signerContext)("", addressOpt);
};

// Re-exported so the host apps can mirror the `zcashShielded` feature flag into
// the coin module (via `useFeature` → `setZcashShieldedEnabled`), the same way
// `setSuiGraphqlEnabled` / `setCosmosLdmkEnabled` are wired. A coin module cannot
// read React feature flags directly, so routing of Zcash sends through the
// shielded PCZT/V5 path is gated by this module-level toggle.
export { setZcashShieldedEnabled } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";

export { bridge, resolver, messageSigner, signerContext };
