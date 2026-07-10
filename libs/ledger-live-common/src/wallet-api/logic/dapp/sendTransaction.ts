import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { getWalletAPITransactionSignFlowInfos } from "../../converters";
import { getMainAccount } from "../../../account/index";
import { getAccountBridge } from "../../../bridge";
import { getTxType } from "../../utils/txTrackingHelper";
import {
  isLedgerButtonReferrer,
  reportLedgerButtonBroadcast,
} from "../../utils/ledgerButtonTracking";
import { withLiveAppContext } from "../../blindSigningContext";
import { AppManifest, DAppTrackingData } from "../../types";
import { TrackingAPI } from "../../tracking";
import { convertEthToLiveTX } from "./convertEthToLiveTX";
import { DappSignOptions, EthTransaction, SignFlowInfos } from "./types";

export type DappSendTransactionContext = {
  manifest: AppManifest;
  account: AccountLike;
  chainID: number;
  tracking: TrackingAPI;
  mevProtected?: boolean;
  referrer?: string;
};

/**
 * https://eth.wiki/json-rpc/API#eth_sendtransaction
 *
 * Signs and (unless disabled) broadcasts a dApp transaction. `signTransaction`
 * bridges the native sign UI; `onBroadcasted` surfaces the optimistic operation
 * to the UI. Fires the dapp send-transaction tracking events and returns the
 * broadcasted operation hash. Throws on failure (after tracking the failure).
 */
export async function dappSendTransactionLogic(
  { manifest, account, chainID, tracking, mevProtected, referrer }: DappSendTransactionContext,
  ethTX: EthTransaction,
  signTransaction: (params: {
    account: AccountLike;
    parentAccount: undefined;
    signFlowInfos: SignFlowInfos;
    options: DappSignOptions;
  }) => Promise<SignedOperation>,
  onBroadcasted: (mainAccount: Account, optimisticOperation: Operation) => void,
): Promise<string> {
  const nanoApp = manifest.dapp?.nanoApp;
  const dependencies = manifest.dapp?.dependencies;
  const tx = convertEthToLiveTX(ethTX);

  let trackingData: DAppTrackingData | undefined;
  try {
    const signFlowInfos = await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account,
    });

    const transactionType = getTxType(signFlowInfos.liveTx as EvmTransaction);

    const accountCurrencyName =
      account.type === "TokenAccount" ? account.token.name : account.currency.name;

    const accountNetwork =
      account.type === "TokenAccount" ? account.token.parentCurrencyId : account.currency.id;

    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      tx.recipient,
      accountNetwork,
    );

    trackingData = {
      type: transactionType,
      currency: token ? token.name : accountCurrencyName,
      network: token ? token.parentCurrencyId : accountNetwork,
    };

    const options = nanoApp ? { hwAppId: nanoApp, dependencies: dependencies } : undefined;
    tracking.dappSendTransactionRequested(manifest, trackingData);

    const signedTransaction = await withLiveAppContext(manifest, () =>
      signTransaction({
        account,
        parentAccount: undefined,
        signFlowInfos,
        options,
      }),
    );

    const bridge = await getAccountBridge(account, undefined);
    const mainAccount = getMainAccount(account, undefined);

    let optimisticOperation: Operation = signedTransaction.operation;

    if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
      optimisticOperation = await bridge.broadcast({
        account: mainAccount,
        signedOperation: signedTransaction,
        broadcastConfig: {
          mevProtected: !!mevProtected,
          source: { type: "dApp", name: manifest.id },
        },
      });
    }

    onBroadcasted(mainAccount, optimisticOperation);

    tracking.dappSendTransactionSuccess(manifest, trackingData);

    if (isLedgerButtonReferrer(referrer)) {
      reportLedgerButtonBroadcast({
        dappId: manifest.id,
        chainId: chainID,
        networkName: trackingData.network,
        transactionHash: optimisticOperation.hash,
        referrer,
      });
    }

    return optimisticOperation.hash;
  } catch (error) {
    tracking.dappSendTransactionFail(manifest, trackingData);
    throw error;
  }
}
