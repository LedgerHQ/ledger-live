import {
  AccountShapeInfo,
  GetAccountShape,
  makeScanAccounts,
  mergeOps,
} from "../../bridge/jsHelpers";
import { makeSync } from "../../bridge/jsHelpers";
import { encodeAccountId, inferSubOperations } from "@ledgerhq/coin-framework/account/index";

import BigNumber from "bignumber.js";
import Ada, { ExtendedPublicKey } from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils/address";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { APITransaction, HashType } from "./api/api-types";
import {
  CardanoAccount,
  CardanoOperation,
  CardanoOperationExtra,
  CardanoOutput,
  PaymentCredential,
  ProtocolParams,
  Transaction,
  StakeCredential,
} from "./types";
import {
  getAccountChange,
  getAccountStakeCredential,
  getBaseAddress,
  getBipPathString,
  getMemoFromTx,
  getOperationType,
  isHexString,
  mergeTokens,
} from "./logic";
import { encodeOperationId } from "../../operation";
import { getNetworkParameters } from "./networks";
import { getNetworkInfo } from "./api/getNetworkInfo";
import uniqBy from "lodash/uniqBy";
import postSyncPatch from "./postSyncPatch";
import { getTransactions } from "./api/getTransactions";
import type {
  AccountBridge,
  CurrencyBridge,
  Operation,
  OperationType,
  TokenAccount,
} from "@ledgerhq/types-live";
import { buildSubAccounts } from "./buildSubAccounts";
import { calculateMinUtxoAmount } from "@stricahq/typhonjs/dist/utils/utils";
import { formatCurrencyUnit, listTokensForCryptoCurrency } from "../../currencies";
import { getDelegationInfo } from "./api/getDelegationInfo";

function mapTxToAccountOperation(
  tx: APITransaction,
  accountId: string,
  accountCredentialsMap: Record<string, PaymentCredential>,
  stakeCredential: StakeCredential,
  subAccounts: Array<TokenAccount>,
  accountShapeInfo: AccountShapeInfo,
  protocolParams: ProtocolParams,
): CardanoOperation {
  const accountChange = getAccountChange(tx, accountCredentialsMap);

  const subOperations = inferSubOperations(tx.hash, subAccounts);
  const memo = getMemoFromTx(tx);
  const extra: CardanoOperationExtra = {};
  if (memo) {
    extra.memo = memo;
  }

  let operationValue = accountChange.ada;

  if (tx.certificate.stakeRegistrations.length) {
    const walletRegistration = tx.certificate.stakeRegistrations.find(
      c =>
        c.stakeCredential.type === HashType.ADDRESS &&
        c.stakeCredential.key === stakeCredential.key,
    );
    if (walletRegistration) {
      extra.deposit = formatCurrencyUnit(
        accountShapeInfo.currency.units[0],
        new BigNumber(protocolParams.stakeKeyDeposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  if (tx.certificate.stakeDeRegistrations.length) {
    const walletDeRegistration = tx.certificate.stakeDeRegistrations.find(
      c =>
        c.stakeCredential.type === HashType.ADDRESS &&
        c.stakeCredential.key === stakeCredential.key,
    );
    if (walletDeRegistration) {
      operationValue = operationValue.minus(protocolParams.stakeKeyDeposit);
      extra.refund = formatCurrencyUnit(
        accountShapeInfo.currency.units[0],
        new BigNumber(protocolParams.stakeKeyDeposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  if (tx.withdrawals && tx.withdrawals.length) {
    const walletWithdraw = tx.withdrawals.find(
      w =>
        w.stakeCredential.type === HashType.ADDRESS &&
        w.stakeCredential.key === stakeCredential.key,
    );
    if (walletWithdraw) {
      operationValue = operationValue.minus(walletWithdraw.amount);
      extra.rewards = formatCurrencyUnit(
        accountShapeInfo.currency.units[0],
        new BigNumber(walletWithdraw.amount),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  const mainOperationType: OperationType = tx.certificate.stakeDelegations.length
    ? "DELEGATE"
    : tx.certificate.stakeDeRegistrations.length
    ? "UNDELEGATE"
    : getOperationType({
        valueChange: operationValue,
        fees: new BigNumber(tx.fees),
      });

  return {
    accountId,
    id: encodeOperationId(accountId, tx.hash, mainOperationType),
    hash: tx.hash,
    type: mainOperationType,
    fee: new BigNumber(tx.fees),
    value: operationValue.absoluteValue(),
    senders: tx.inputs.map(i =>
      isHexString(i.address) ? TyphonUtils.getAddressFromHex(i.address).getBech32() : i.address,
    ),
    recipients: tx.outputs.map(o =>
      isHexString(o.address) ? TyphonUtils.getAddressFromHex(o.address).getBech32() : o.address,
    ),
    subOperations,
    blockHeight: tx.blockHeight,
    date: new Date(tx.timestamp),
    extra: extra,
    blockHash: undefined,
  };
}

function prepareUtxos(
  newTransactions: Array<APITransaction>,
  stableUtxos: Array<CardanoOutput>,
  accountCredentialsMap: Record<string, PaymentCredential>,
): Array<CardanoOutput> {
  const newUtxos: Array<CardanoOutput> = [];
  // spentUtxoKey = txId#index
  const spentUtxoKeys: Set<string> = new Set();

  newTransactions.forEach(t => {
    t.inputs.forEach(i => {
      const cred = accountCredentialsMap[i.paymentKey];
      if (cred) spentUtxoKeys.add(`${i.txId}#${i.index}`);
    });

    t.outputs.forEach((o, outputIndex) => {
      const cred = accountCredentialsMap[o.paymentKey];
      if (cred) {
        newUtxos.push({
          hash: t.hash,
          index: outputIndex,
          address: o.address,
          amount: new BigNumber(o.value),
          tokens: o.tokens.map(token => ({
            assetName: token.assetName,
            policyId: token.policyId,
            amount: new BigNumber(token.value),
          })),
          paymentCredential: {
            key: o.paymentKey,
            path: cred.path,
          },
        });
      }
    });
  });

  const utxos = uniqBy([...stableUtxos, ...newUtxos], u => `${u.hash}#${u.index}`).filter(
    u => !spentUtxoKeys.has(`${u.hash}#${u.index}`),
  );

  return utxos;
}

export type SignerContext = (
  deviceId: string,
  fn: (signer: Ada) => Promise<ExtendedPublicKey>,
) => Promise<ExtendedPublicKey>;

const makeGetAccountShape =
  (signerContext: SignerContext): GetAccountShape =>
  async (info, { blacklistedTokenIds }) => {
    const {
      currency,
      index: accountIndex,
      derivationPath,
      derivationMode,
      initialAccount,
      deviceId,
    } = info;
    // In case we get a full derivation path
    const rootPath = derivationPath.split("/", 2).join("/");
    const accountPath = `${rootPath}/${accountIndex}'`;

    const paramXpub = initialAccount?.xpub;
    let extendedPubKeyRes;
    if (!paramXpub) {
      if (deviceId === undefined || deviceId === null) {
        // deviceId not provided
        throw new Error("deviceId required to generate the xpub");
      }
      extendedPubKeyRes = await signerContext(deviceId, signer =>
        signer.getExtendedPublicKey({
          path: str_to_path(accountPath),
        }),
      );
    }
    const xpub = paramXpub || `${extendedPubKeyRes.publicKeyHex}${extendedPubKeyRes.chainCodeHex}`;
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: xpub,
      derivationMode,
    });

    // when new tokens are added / blacklist changes, we need to sync again because we need to go through all operations again
    const syncHash =
      JSON.stringify(blacklistedTokenIds || []) +
      "_" +
      listTokensForCryptoCurrency(currency, {
        withDelisted: true,
      }).length;
    const outdatedSyncHash = initialAccount?.syncHash !== syncHash;

    const requiredConfirmations = 90;

    const oldOperations = initialAccount?.operations || [];
    const lastBlockHeight = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;

    const syncFromBlockHeight = outdatedSyncHash
      ? 0
      : lastBlockHeight > requiredConfirmations
      ? lastBlockHeight - requiredConfirmations
      : 0;

    const {
      transactions: newTransactions,
      blockHeight,
      externalCredentials,
      internalCredentials,
    } = await getTransactions(
      xpub,
      accountIndex,
      initialAccount as CardanoAccount,
      syncFromBlockHeight,
      currency,
    );

    const accountCredentialsMap = [...externalCredentials, ...internalCredentials].reduce(
      (finalMap, cred) => {
        finalMap[cred.key] = cred;
        return finalMap;
      },
      {} as Record<string, PaymentCredential>,
    );

    const stableOperationsByIds: Record<string, Operation> = {};
    (initialAccount?.operations || []).forEach(o => {
      if ((o.blockHeight as number) < syncFromBlockHeight) {
        stableOperationsByIds[o.hash] = o;
      }
    });

    const stableUtxos = ((initialAccount as CardanoAccount)?.cardanoResources?.utxos || []).filter(
      u => stableOperationsByIds[u.hash],
    );

    const utxos = prepareUtxos(newTransactions, stableUtxos, accountCredentialsMap);
    let accountBalance = utxos.reduce((total, u) => total.plus(u.amount), new BigNumber(0));
    const tokenBalance = mergeTokens(utxos.map(u => u.tokens).flat());
    const subAccounts = buildSubAccounts({
      initialAccount,
      parentAccountId: accountId,
      parentCurrency: currency,
      newTransactions,
      tokens: tokenBalance,
      accountCredentialsMap,
    }).filter(a => !blacklistedTokenIds?.includes(a.token.id));

    const stakeCredential = getAccountStakeCredential(xpub, accountIndex);
    const networkParams = getNetworkParameters(currency.id);
    const freshAddresses = externalCredentials
      .filter(c => !c.isUsed)
      .map(c => ({
        derivationPath: getBipPathString(c.path),
        address: getBaseAddress({
          networkId: networkParams.networkId,
          paymentCred: c,
          stakeCred: stakeCredential,
        }).getBech32(),
      }));
    const cardanoNetworkInfo = await getNetworkInfo(initialAccount as CardanoAccount, currency);
    const delegationInfo = await getDelegationInfo(currency, stakeCredential.key);
    if (delegationInfo?.rewards) {
      accountBalance = accountBalance.plus(delegationInfo.rewards);
    }

    const minAdaBalanceForTokens = tokenBalance.length
      ? calculateMinUtxoAmount(
          tokenBalance,
          new BigNumber(cardanoNetworkInfo.protocolParams.lovelacePerUtxoWord),
          false,
        )
      : new BigNumber(0);

    const newOperations = newTransactions.map(t =>
      mapTxToAccountOperation(
        t,
        accountId,
        accountCredentialsMap,
        stakeCredential,
        subAccounts,
        info,
        cardanoNetworkInfo.protocolParams,
      ),
    );

    const operations = mergeOps(Object.values(stableOperationsByIds), newOperations);

    return {
      id: accountId,
      xpub,
      balance: accountBalance,
      spendableBalance: accountBalance.minus(minAdaBalanceForTokens),
      operations: operations,
      syncHash,
      subAccounts,
      freshAddresses,
      freshAddress: freshAddresses[0].address,
      freshAddressPath: freshAddresses[0].derivationPath,
      blockHeight,
      cardanoResources: {
        utxos,
        externalCredentials,
        internalCredentials,
        delegation: delegationInfo,
        protocolParams: cardanoNetworkInfo.protocolParams,
      },
    };
  };

export const scanAccounts = (signerContext: SignerContext): CurrencyBridge["scanAccounts"] =>
  makeScanAccounts({ getAccountShape: makeGetAccountShape(signerContext) });

export const sync = (signerContext: SignerContext): AccountBridge<Transaction>["sync"] =>
  makeSync({
    getAccountShape: makeGetAccountShape(signerContext),
    postSync: postSyncPatch,
  });
