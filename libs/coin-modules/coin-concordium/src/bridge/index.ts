import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import concordiumCoinConfig from "../config";
import resolver from "../signer";
import { ConcordiumAccount, ConcordiumCurrencyBridge, ConcordiumSigner } from "../types";
import type { Transaction, ConcordiumCoinConfig } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { buildOnboardAccount, buildPairWalletConnect } from "./onboard";
import { prepareTransaction } from "./prepareTransaction";
import { buildReceive } from "./receive";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape } from "./sync";
import { updateTransaction } from "./updateTransaction";
import { validateAddress } from "./validateAddress";

export function createBridges(
  signerContext: SignerContext<ConcordiumSigner>,
  coinConfig: CoinConfig<ConcordiumCoinConfig>,
) {
  concordiumCoinConfig.setCoinConfig(coinConfig);

  const getAddress = resolver(signerContext);
  const receive = buildReceive(signerContext);
  const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddress });
  const onboardAccount = buildOnboardAccount(signerContext);
  const pairWalletConnect = buildPairWalletConnect();

  const currencyBridge: ConcordiumCurrencyBridge = {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
    pairWalletConnect,
    onboardAccount,
  };

  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

  const accountBridge: AccountBridge<Transaction, ConcordiumAccount> = {
    broadcast,
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    validateAddress,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
