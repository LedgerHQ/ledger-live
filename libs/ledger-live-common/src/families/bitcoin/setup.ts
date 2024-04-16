// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { firstValueFrom, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { Bridge } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Btc from "@ledgerhq/hw-app-btc";
import { createBridges } from "@ledgerhq/coin-bitcoin/bridge/js";
import type { SignerContext } from "@ledgerhq/coin-bitcoin/signer";
import makeCliTools from "@ledgerhq/coin-bitcoin/cli-transaction";
import bitcoinResolver from "@ledgerhq/coin-bitcoin/hw-getAddress";
import { signMessage } from "@ledgerhq/coin-bitcoin/hw-signMessage";
import { Transaction } from "@ledgerhq/coin-bitcoin/types";
import { GetAddressOptions, Resolver } from "../../hw/getAddress/types";
import { withDevice } from "../../hw/deviceAccess";
import { startSpan } from "../../performance";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

const signerContext: SignerContext = <T>(
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: Btc) => Promise<T>,
): Promise<T> =>
  firstValueFrom(
    withDevice(deviceId)((transport: Transport) =>
      from(fn(new Btc({ transport, currency: crypto.id }))),
    ),
  );

const createSigner = (transport: Transport, currency: CryptoCurrency) => {
  return new Btc({ transport, currency: currency.id });
};

const bridge: Bridge<Transaction> = createBridges(signerContext, {
  startSpan,
});

const messageSigner = {
  signMessage: signMessage(signerContext),
};

const resolver: Resolver = (
  transport: Transport,
  addressOpt: GetAddressOptions,
): ReturnType<GetAddressFn> => {
  const signerContext: SignerContext = (_, crypto, fn) => fn(createSigner(transport, crypto));
  return bitcoinResolver(signerContext)("", addressOpt);
};

const cliTools = makeCliTools();

export { bridge, cliTools, resolver, messageSigner, signerContext };
