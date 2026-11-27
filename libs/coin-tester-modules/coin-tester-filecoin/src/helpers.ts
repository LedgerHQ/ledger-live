import BigNumber from "bignumber.js";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { createBridges } from "@ledgerhq/coin-filecoin";
import type { FilecoinSigner, Transaction } from "@ledgerhq/coin-filecoin/types";
import { filecoinDefaults } from "@ledgerhq/coin-filecoin/config";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FIL_AIRDROP, USDFC, USDFC_AIRDROP } from "./fixtures";
import { evmAddressOf, waitForMessage } from "./sandbox";
import type { GenericFilecoinSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

/**
 * Wraps the legacy bridge as a `GenericTransaction` bridge so one scenario runs through both
 * strategies. The prepared legacy transaction (fees, nonce, method) is kept aside, keyed by the
 * generic one, and reused by status and signing.
 */
function adaptLegacyBridge(bridge: AccountBridge<Transaction>): AccountBridge<GenericTransaction> {
  const prepared = new WeakMap<GenericTransaction, Transaction>();

  const toLegacy = (tx: GenericTransaction): Transaction => ({
    ...bridge.createTransaction({} as Account),
    amount: tx.amount,
    recipient: tx.recipient,
    useAllAmount: tx.useAllAmount ?? false,
    subAccountId: tx.subAccountId,
  });

  const requirePrepared = (tx: GenericTransaction): Transaction => {
    const legacy = prepared.get(tx);
    if (!legacy) throw new Error("no prepared legacy transaction for this generic transaction");
    return legacy;
  };

  return {
    sync: bridge.sync,
    receive: bridge.receive,
    broadcast: bridge.broadcast,
    validateAddress: bridge.validateAddress,
    signRawOperation: bridge.signRawOperation,
    getSerializedAddressParameters: bridge.getSerializedAddressParameters,
    createTransaction: () => ({
      family: "filecoin",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
    }),
    updateTransaction: (tx, patch) => ({ ...tx, ...patch }),
    prepareTransaction: async (account, tx) => {
      const legacy = await bridge.prepareTransaction(account, toLegacy(tx));
      const result: GenericTransaction = {
        ...tx,
        amount: legacy.amount,
        recipient: legacy.recipient,
      };
      prepared.set(result, legacy);
      return result;
    },
    getTransactionStatus: (account, tx) =>
      bridge.getTransactionStatus(account, requirePrepared(tx)),
    signOperation: ({ account, transaction, deviceId }) =>
      bridge.signOperation({ account, transaction: requirePrepared(transaction), deviceId }),
    estimateMaxSpendable: ({ account, parentAccount, transaction }) =>
      bridge.estimateMaxSpendable({
        account,
        parentAccount,
        transaction: transaction ? toLegacy(transaction) : undefined,
      }),
  };
}

/**
 * `legacy` is the bridge Ledger Live ships; `generic-adapter` reaches coin-filecoin through the
 * coin module loaders and the shared framework bridge.
 */
export async function getBridges(
  strategy: BridgeStrategy,
  signers: { legacy: FilecoinSigner; generic: GenericFilecoinSigner },
): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
}> {
  if (strategy === "legacy") {
    const context: SignerContext<FilecoinSigner> = (_deviceId, fn) => fn(signers.legacy);
    const { currencyBridge, accountBridge } = createBridges(context);
    return { currencyBridge, accountBridge: adaptLegacyBridge(accountBridge) };
  }

  const context: SignerContext<GenericFilecoinSigner> = (_deviceId, fn) => fn(signers.generic);
  const getAddress: GetAddressFn = async (deviceId, opts) => {
    const { address, publicKey } = await context(deviceId, s => s.getAddress(opts.path));
    return { address, publicKey, path: opts.path };
  };

  const accountBridge = await getCoinFrameworkAccountBridge("filecoin", "local", {
    context,
    getAddress,
  });

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("filecoin", "local", {
      context,
      getAddress,
    }),
    // The framework's `createTransaction` has no filecoin case: the family is not in
    // `genericCoinFrameworkFamilies.json`, so it gets the plain send defaults here.
    accountBridge: {
      ...accountBridge,
      createTransaction: () => ({
        family: "filecoin",
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        mode: "send",
      }),
    },
  };
}

/** Points the generic path's currency config at the sandbox indexer instead of the remote default. */
export function setLocalFilecoinConfig(indexerUrl: string): void {
  LiveConfig.setConfig({
    config_currency_filecoin: {
      type: "object",
      default: {
        ...filecoinDefaults.filecoin,
        indexer: { url: indexerUrl, maxPage: filecoinDefaults.filecoin.indexer.maxPage },
      },
    },
  });
}

// The node resolves a new account for fee estimation and nonces one tipset after the message that
// created it executed, so the funding waits for that one too.
const FUNDING_CONFIDENCE = 2;

/**
 * Funds FIL first, which creates the actor, then the token to the account's ID-masked address:
 * that is the key the indexer serves the ERC-20 balance and history under.
 */
export async function fundAccount(
  sandbox: Sandbox,
  address: string,
  withToken: boolean,
): Promise<void> {
  await waitForMessage(await sandbox.airdrop(address, FIL_AIRDROP), FUNDING_CONFIDENCE);
  if (withToken) {
    const token = await sandbox.airdrop(
      await evmAddressOf(address),
      USDFC_AIRDROP,
      USDFC.contractAddress,
    );
    await waitForMessage(token, FUNDING_CONFIDENCE);
  }
}
