// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { firstValueFrom, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { Bridge } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import Btc from "@ledgerhq/hw-app-btc";
import { createBridges } from "@ledgerhq/coin-bitcoin/bridge/js";
import type { BitcoinSigner, SignerContext } from "@ledgerhq/coin-bitcoin/signer";
import bitcoinResolver from "@ledgerhq/coin-bitcoin/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-bitcoin/hw-signMessage";
import { BitcoinAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-bitcoin/types";
import { GetAddressOptions, Resolver } from "../../hw/getAddress/types";
import { withDevice } from "../../hw/deviceAccess";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { SignMessage } from "../../hw/signMessage/types";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/networks";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";

const createSigner = (transport: Transport, currency: CryptoCurrency): BitcoinSigner =>
  new Btc({ transport, currency: currency.id });

const signerContext: SignerContext = <T>(
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: BitcoinSigner) => Promise<T>,
): Promise<T> =>
  firstValueFrom(
    withDevice(deviceId)((transport: Transport) => from(fn(createSigner(transport, crypto)))),
  );

// One bridge serves every bitcoin-family currency: each call resolves the config of its own
// currency (`context.config(currency.id)`), "bitcoin" is only the fallback id.
const context = buildContext<BitcoinCoinConfig>("bitcoin");

const bridge: Bridge<Transaction, BitcoinAccount, TransactionStatus> = createBridges(
  signerContext,
  context,
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
  return bitcoinResolver(signerContext, context.logger)("", addressOpt);
};

/** A UTXO account is known by its xpub at the account-level path, as the bitcoin sync derives it. */
const deriveAccountDescriptor: DeriveAccountDescriptor = async (deviceId, currency, candidate) => {
  const xpubVersion = getNetworkParameters(currency.id).xpubVersion.readUInt32BE(0);
  const path = candidate.accountPath.slice(2).replaceAll("h", "'");
  const xpub = await signerContext(deviceId, currency, signer =>
    signer.getWalletXpub({ path, xpubVersion }),
  );
  return AccountDescriptorSchema.parse({
    purpose: "account",
    version: "1",
    type: "utxo",
    network: candidate.network,
    xpub,
    path: candidate.accountPath,
  });
};

export { bridge, resolver, messageSigner, signerContext, deriveAccountDescriptor };
