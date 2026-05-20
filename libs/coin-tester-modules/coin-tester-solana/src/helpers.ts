import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import resolver from "@ledgerhq/coin-solana/hw-getAddress";
import {
  solanaGetAddress,
  SolanaSigner as CoinFrameworkSolanaSigner,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/families/solana/signer";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import type { Transaction } from "@ledgerhq/coin-solana/types";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import type { Signers } from "./signer";
import BigNumber from "bignumber.js";

registerCoinModules(coinModuleLoaders);

export const solana = getCryptoCurrencyById("solana");

function genericToTransaction(tx: GenericTransaction): Transaction {
  const base = {
    family: "solana" as const,
    amount: tx.amount,
    recipient: tx.recipient,
    useAllAmount: tx.useAllAmount ?? false,
    subAccountId: tx.subAccountId,
  };

  switch (tx.mode) {
    case "stake":
      return {
        ...base,
        model: {
          kind: "stake.createAccount",
          uiState: { delegate: { voteAccAddress: tx.recipient } },
        },
      };
    case "delegate":
      return {
        ...base,
        model: {
          kind: "stake.delegate",
          uiState: { stakeAccAddr: tx.memoValue ?? "", voteAccAddr: tx.recipient },
        },
      };
    case "undelegate":
      return {
        ...base,
        model: { kind: "stake.undelegate", uiState: { stakeAccAddr: tx.recipient } },
      };
    case "unstake":
      return {
        ...base,
        model: { kind: "stake.withdraw", uiState: { stakeAccAddr: tx.recipient } },
      };
    default:
      if (tx.subAccountId) {
        return {
          ...base,
          model: {
            kind: "token.transfer",
            uiState: { subAccountId: tx.subAccountId, memo: tx.memoValue ?? undefined },
          },
        };
      }
      return {
        ...base,
        model: { kind: "transfer", uiState: { memo: tx.memoValue ?? undefined } },
      };
  }
}

function adaptLegacyBridge(bridge: AccountBridge<Transaction>): AccountBridge<GenericTransaction> {
  const preparedTxMap = new WeakMap<GenericTransaction, Transaction>();

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    signRawOperation: bridge.signRawOperation,
    createTransaction: () => ({
      family: "solana",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      mode: "send",
    }),
    updateTransaction: (tx, patch) => ({ ...tx, ...patch }),
    prepareTransaction: async (account, gt) => {
      const prepared = await bridge.prepareTransaction(account, genericToTransaction(gt));
      const result: GenericTransaction = {
        ...gt,
        amount: prepared.amount,
        recipient: prepared.recipient,
      };
      preparedTxMap.set(result, prepared);
      return result;
    },
    getTransactionStatus: (account, gt) =>
      bridge.getTransactionStatus(account, preparedTxMap.get(gt) ?? genericToTransaction(gt)),
    signOperation: ({ account, transaction: gt, deviceId }) =>
      bridge.signOperation({
        account,
        transaction: preparedTxMap.get(gt) ?? genericToTransaction(gt),
        deviceId,
      }),
    estimateMaxSpendable: ({ account, parentAccount, transaction: gt }) =>
      bridge.estimateMaxSpendable({
        account,
        parentAccount,
        transaction: gt ? genericToTransaction(gt) : undefined,
      }),
  };
}

export async function getBridges(
  strategy: BridgeStrategy,
  signers: Signers,
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  if (strategy === "legacy") {
    const signerContext: SignerContext<SolanaSigner> = (_, fn) => fn(signers.bridge);
    const getAddress = resolver(signerContext);

    const { currencyBridge, accountBridge } = createBridges(signerContext, () => ({
      status: { type: "active" as const },
      token2022Enabled: true,
      legacyOCMSMaxVersion: "1.8.0",
    }));

    return {
      currencyBridge,
      accountBridge: adaptLegacyBridge(accountBridge as unknown as AccountBridge<Transaction>),
      getAddress,
    };
  }

  const coinframeworkSignerContext: SignerContext<CoinFrameworkSolanaSigner> = (_, fn) => fn(signers.coinframework);
  const coinframeworkGetAddress = solanaGetAddress(coinframeworkSignerContext);

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("solana", "local", {
      context: coinframeworkSignerContext,
      getAddress: coinframeworkGetAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("solana", "local", {
      context: coinframeworkSignerContext,
      getAddress: coinframeworkGetAddress,
    }),
    getAddress: coinframeworkGetAddress,
  };
}
