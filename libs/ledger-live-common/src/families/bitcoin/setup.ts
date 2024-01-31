// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-bitcoin/bridge/js";
import type {
  BitcoinXPub,
  BitcoinAddress,
  BitcoinSignature,
  SignerContext,
} from "@ledgerhq/coin-bitcoin/signer";
import makeCliTools from "@ledgerhq/coin-bitcoin/cli-transaction";
import bitcoinResolver from "@ledgerhq/coin-bitcoin/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-bitcoin/types";
import Btc from "@ledgerhq/hw-app-btc";
import Transport from "@ledgerhq/hw-transport";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { Bridge } from "@ledgerhq/types-live";
import { createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";

const signerContext: SignerContext = (
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: Btc) => Promise<BitcoinXPub | BitcoinAddress | BitcoinSignature>,
): Promise<BitcoinXPub | BitcoinAddress | BitcoinSignature> =>
  firstValueFrom(
    withDevice(deviceId)((transport: Transport) =>
      from(fn(new Btc({ transport, currency: crypto.id }))),
    ),
  );

const bridge: Bridge<Transaction> = createBridges(signerContext, network, makeLRUCache);

const resolver: Resolver = createResolver(createSigner, bitcoinResolver);

const cliTools = makeCliTools(network, makeLRUCache);

export { bridge, cliTools, resolver };
