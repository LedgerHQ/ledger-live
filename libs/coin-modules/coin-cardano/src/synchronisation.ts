import uniqBy from "lodash/uniqBy";
import BigNumber from "bignumber.js";
import {
  AccountShapeInfo,
  GetAccountShape,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { utils as TyphonUtils, address as TyphonAddress } from "@stricahq/typhonjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { encodeAccountId, getSyncHash } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization/index";
import type { Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { getDelegationInfo } from "./api/getDelegationInfo";
import { APITransaction, HashType } from "./api/api-types";
import { getTransactions } from "./api/getTransactions";
import { fetchNetworkInfo } from "./api/getNetworkInfo";
import { buildSubAccounts } from "./buildSubAccounts";
import { getNetworkParameters } from "./networks";
import { CardanoSigner } from "./signer";
import {
  CardanoAccount,
  CardanoOperation,
  CardanoOperationExtra,
  CardanoOutput,
  PaymentCredential,
  ProtocolParams,
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
import { CARDANO_MAX_SUPPLY } from "./constants";

export const makeGetAccountShape =
  (signerContext: SignerContext<CardanoSigner>): GetAccountShape<CardanoAccount> =>
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
    let xpub;
    if (!paramXpub) {
      if (deviceId === undefined || deviceId === null) {
        // deviceId not provided
        throw new Error("deviceId required to generate the xpub");
      }
      const extendedPubKeyRes = await signerContext(deviceId, signer =>
        signer.getPublicKey(accountPath),
      );
      xpub = `${extendedPubKeyRes.publicKeyHex}${extendedPubKeyRes.chainCodeHex}`;
    } else {
      xpub = paramXpub;
    }
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: xpub,
      derivationMode,
    });

    // when new tokens are added / blacklist changes, we need to sync again because we need to go through all operations again
    const syncHash = await getSyncHash(currency.id, blacklistedTokenIds);
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
    } = await getTransactions(xpub, accountIndex, initialAccount, syncFromBlockHeight, currency);

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

    const stableUtxos = (initialAccount?.cardanoResources?.utxos || []).filter(
      u => stableOperationsByIds[u.hash],
    );

    const utxos = prepareUtxos(newTransactions, stableUtxos, accountCredentialsMap);
    const utxosSum = utxos.reduce((total, u) => total.plus(u.amount), new BigNumber(0));
    const tokenBalance = mergeTokens(utxos.map(u => u.tokens).flat());
    const subAccounts = (
      await buildSubAccounts({
        initialAccount,
        parentAccountId: accountId,
        parentCurrency: currency,
        newTransactions,
        tokens: tokenBalance,
        accountCredentialsMap,
      })
    ).filter(a => !blacklistedTokenIds?.includes(a.token.id));

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
    const cardanoNetworkInfo = await fetchNetworkInfo(currency);
    const delegationInfo = await getDelegationInfo(currency, stakeCredential.key);

    const totalBalance = delegationInfo?.rewards ? utxosSum.plus(delegationInfo.rewards) : utxosSum;

    const minAdaForTokens = tokenBalance.length
      ? TyphonUtils.calculateMinUtxoAmountBabbage(
          {
            address: TyphonUtils.getAddressFromString(freshAddresses[0].address),
            amount: new BigNumber(CARDANO_MAX_SUPPLY),
            tokens: tokenBalance,
          },
          new BigNumber(cardanoNetworkInfo.protocolParams.utxoCostPerByte),
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

    let spendableBalance = BigNumber.max(0, utxosSum.minus(minAdaForTokens));
    if (delegationInfo?.dRepHex && delegationInfo?.rewards) {
      // if account is delegated to a dRep, include rewards in spendable balance
      spendableBalance = spendableBalance.plus(delegationInfo.rewards);
    }

    return {
      id: accountId,
      xpub,
      balance: totalBalance,
      spendableBalance,
      operations: operations,
      syncHash,
      subAccounts,
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

export function mapTxToAccountOperation(
  tx: APITransaction,
  accountId: string,
  accountCredentialsMap: Record<string, PaymentCredential>,
  stakeCredential: StakeCredential,
  subAccounts: Array<TokenAccount>,
  accountShapeInfo: AccountShapeInfo,
  protocolParams: ProtocolParams,
): CardanoOperation {
  const accountChange = getAccountChange(tx, accountCredentialsMap);
  const networkParams = getNetworkParameters(accountShapeInfo.currency.id);
  const stakeAddress = new TyphonAddress.RewardAddress(networkParams.networkId, {
    type: HashType.ADDRESS,
    hash: Buffer.from(stakeCredential.key, "hex"),
  });

  const subOperations = inferSubOperations(tx.hash, subAccounts);
  const memo = getMemoFromTx(tx);
  const extra: CardanoOperationExtra = {};
  if (memo) {
    extra.memo = memo;
  }

  let operationValue = accountChange.ada;

  // pre-conway era stake registrations
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

  // conway era stake registrations
  if (tx.certificate.stakeRegsConway?.length) {
    const walletRegistration = tx.certificate.stakeRegsConway.find(
      w => stakeAddress.getHex() === w.stakeHex,
    );
    if (walletRegistration) {
      extra.deposit = formatCurrencyUnit(
        accountShapeInfo.currency.units[0],
        new BigNumber(walletRegistration.deposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  // pre-conway era stake de-registrations
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

  // conway era stake de-registrations
  if (tx.certificate.stakeDeRegsConway?.length) {
    const walletDeRegistration = tx.certificate.stakeDeRegsConway.find(
      w => stakeAddress.getHex() === w.stakeHex,
    );
    if (walletDeRegistration) {
      operationValue = operationValue.minus(walletDeRegistration.deposit);
      extra.refund = formatCurrencyUnit(
        accountShapeInfo.currency.units[0],
        new BigNumber(walletDeRegistration.deposit),
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

  let mainOperationType: OperationType;
  if (tx.certificate.stakeDelegations.length) {
    mainOperationType = "DELEGATE";
  } else if (
    tx.certificate.stakeDeRegistrations.length ||
    tx.certificate.stakeDeRegsConway?.length
  ) {
    mainOperationType = "UNDELEGATE";
  } else {
    mainOperationType = getOperationType({
      valueChange: operationValue,
      fees: new BigNumber(tx.fees),
    });
  }

  return {
    accountId,
    id: encodeOperationId(accountId, tx.hash, mainOperationType),
    hash: tx.hash,
    type: mainOperationType,
    fee: new BigNumber(tx.fees),
    value: operationValue.absoluteValue(),
    senders: tx.inputs.map(i =>
      isHexString(i.address)
        ? TyphonUtils.getAddressFromHex(Buffer.from(i.address, "hex")).getBech32()
        : i.address,
    ),
    recipients: tx.outputs.map(o =>
      isHexString(o.address)
        ? TyphonUtils.getAddressFromHex(Buffer.from(o.address, "hex")).getBech32()
        : o.address,
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
