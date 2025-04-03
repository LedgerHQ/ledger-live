import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

import type { CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { IconCoinConfig, setCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { initAccount } from "../initAccount";
import { prepareTransaction } from "../prepareTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { IconSigner } from "../signer";
import { buildSignOperation } from "../signOperation";
import { getAccountShape } from "../synchronization";
import { serialization } from "../transaction";
import type { IconAccountBridge, IconBridge } from "../types/index";

function buildCurrencyBridge(signerContext: SignerContext<IconSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

function buildAccountBridge(signerContext: SignerContext<IconSigner>): IconAccountBridge {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    assignToAccountRaw,
    assignFromAccountRaw,
    initAccount,
    signOperation,
    broadcast,
    estimateMaxSpendable,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<IconSigner>,
  coinConfig: CoinConfig<IconCoinConfig>,
): IconBridge {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    ...serialization,
  };
}
