import {
  Transaction as TyphonTransaction,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import {
  getAccountStakeCredential,
  getBaseAddress,
  getTTL,
  mergeTokens,
  isProtocolParamsValid,
} from "./logic";
import { decodeTokenAssetId, decodeTokenCurrencyId, getTokenAssetId } from "./buildSubAccounts";
import { getNetworkParameters } from "./networks";
import {
  CardanoAccount,
  CardanoOutput,
  CardanoResources,
  PaymentCredential,
  Token,
  Transaction,
} from "./types";
import { CARDANO_MAX_SUPPLY } from "./constants";
import { CardanoInvalidProtoParams } from "./errors";

function getTyphonInputFromUtxo(utxo: CardanoOutput): TyphonTypes.Input {
  const address = TyphonUtils.getAddressFromHex(
    Buffer.from(utxo.address, "hex"),
  ) as TyphonTypes.ShelleyAddress;
  if (address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) {
    address.paymentCredential.bipPath = utxo.paymentCredential.path;
  }

  return {
    txId: utxo.hash,
    index: utxo.index,
    amount: new BigNumber(utxo.amount),
    tokens: utxo.tokens,
    address: address,
  };
}

function getRewardWithdrawalCertificate(_account: CardanoAccount): TyphonTypes.Withdrawal | null {
  return null;

  /**
   * Disable rewards withdraw certificate, as a work around for Chang 2 hard fork
   */

  // if (!account.cardanoResources.delegation?.rewards.gt(0)) {
  //   return null;
  // }

  // const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
  // const stakeKeyHashCredential: TyphonTypes.HashCredential = {
  //   hash: Buffer.from(stakeCredential.key, "hex"),
  //   type: TyphonTypes.HashType.ADDRESS,
  //   bipPath: stakeCredential.path,
  // };

  // const networkId = isTestnet(account.currency)
  //   ? TyphonTypes.NetworkId.TESTNET
  //   : TyphonTypes.NetworkId.MAINNET;
  // const rewardAddress = new RewardAddress(networkId, stakeKeyHashCredential);
  // const rewardsWithdrawalCertificate: TyphonTypes.Withdrawal = {
  //   rewardAccount: rewardAddress,
  //   amount: account.cardanoResources.delegation.rewards,
  // };

  // return rewardsWithdrawalCertificate;
}

const buildSendTokenTransaction = async ({
  account,
  transaction,
  tokenAccount,
  typhonTx,
  receiverAddress,
  changeAddress,
}: {
  account: CardanoAccount;
  transaction: Transaction;
  tokenAccount: TokenAccount;
  typhonTx: TyphonTransaction;
  receiverAddress: TyphonTypes.CardanoAddress;
  changeAddress: TyphonTypes.CardanoAddress;
}): Promise<TyphonTransaction> => {
  const cardanoResources = account.cardanoResources as CardanoResources;

  const { assetId } = decodeTokenCurrencyId(tokenAccount.token.id);
  const { policyId, assetName } = decodeTokenAssetId(assetId);
  const transactionAmount = transaction.useAllAmount ? tokenAccount.balance : transaction.amount;

  const tokensToSend = [
    {
      policyId,
      assetName,
      amount: transactionAmount,
    },
  ];
  const tokenUtxos: Array<CardanoOutput> = [];
  const otherUtxos: Array<CardanoOutput> = [];

  cardanoResources.utxos.forEach(u => {
    if (u.tokens.some(t => getTokenAssetId(t) === assetId)) {
      tokenUtxos.push(u);
    } else {
      otherUtxos.push(u);
    }
  });
  const sortedTokenUtxo = tokenUtxos.sort((a, b) => {
    const sendingTokenA = a.tokens.find(t => getTokenAssetId(t) === assetId) as Token;
    const sendingTokenB = b.tokens.find(t => getTokenAssetId(t) === assetId) as Token;
    const diff = sendingTokenB.amount.minus(sendingTokenA.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });
  const sortedOtherUtxos = otherUtxos.sort((a, b) => {
    const diff = b.amount.minus(a.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });

  const totalAddedTokenAmount = new BigNumber(0);
  const requiredMinAdaForTokens = TyphonUtils.calculateMinUtxoAmountBabbage(
    {
      address: receiverAddress,
      amount: new BigNumber(CARDANO_MAX_SUPPLY),
      tokens: tokensToSend,
    },
    new BigNumber(cardanoResources.protocolParams.utxoCostPerByte),
  );
  // Add enough utxo to cover token amount
  for (let i = 0; i < sortedTokenUtxo.length; i++) {
    const u = sortedTokenUtxo[i];
    const sendingToken = u.tokens.find(t => getTokenAssetId(t) === assetId) as Token;
    typhonTx.addInput(getTyphonInputFromUtxo(u));
    totalAddedTokenAmount.plus(sendingToken.amount);
    if (totalAddedTokenAmount.gte(transactionAmount)) break;
  }

  const requiredInputAmount = requiredMinAdaForTokens.plus(10e6);
  // Add enough utxos to cover the transaction fees
  for (let i = 0; i < sortedOtherUtxos.length; i++) {
    const u = sortedOtherUtxos[i];
    if (typhonTx.getInputAmount().ada.gte(requiredInputAmount)) {
      break;
    }
    typhonTx.addInput(getTyphonInputFromUtxo(u));
  }

  const rewardsWithdrawalCertificate = getRewardWithdrawalCertificate(account);
  if (rewardsWithdrawalCertificate) typhonTx.addWithdrawal(rewardsWithdrawalCertificate);

  typhonTx.addOutput({
    address: receiverAddress,
    amount: requiredMinAdaForTokens,
    tokens: tokensToSend,
  });

  return typhonTx.prepareTransaction({
    inputs: [],
    changeAddress,
  });
};

const buildSendAdaTransaction = async ({
  account,
  transaction,
  typhonTx,
  receiverAddress,
  changeAddress,
}: {
  account: CardanoAccount;
  transaction: Transaction;
  typhonTx: TyphonTransaction;
  receiverAddress: TyphonTypes.CardanoAddress;
  changeAddress: TyphonTypes.CardanoAddress;
}): Promise<TyphonTransaction> => {
  const cardanoResources = account.cardanoResources as CardanoResources;
  const protocolParams = cardanoResources.protocolParams;

  if (transaction.useAllAmount) {
    // add all utxo as input
    cardanoResources.utxos.forEach(u => typhonTx.addInput(getTyphonInputFromUtxo(u)));

    const tokenBalance = mergeTokens(cardanoResources.utxos.map(u => u.tokens).flat());

    // if account holds any tokens then add it to changeAddress,
    // with minimum required ADA to spend those tokens
    if (tokenBalance.length) {
      const minAmountForChangeTokens = TyphonUtils.calculateMinUtxoAmountBabbage(
        {
          address: changeAddress,
          amount: new BigNumber(CARDANO_MAX_SUPPLY),
          tokens: tokenBalance,
        },
        new BigNumber(protocolParams.utxoCostPerByte),
      );
      typhonTx.addOutput({
        address: changeAddress,
        amount: minAmountForChangeTokens,
        tokens: tokenBalance,
      });
    }

    const rewardsWithdrawalCertificate = getRewardWithdrawalCertificate(account);
    if (rewardsWithdrawalCertificate) typhonTx.addWithdrawal(rewardsWithdrawalCertificate);

    return typhonTx.prepareTransaction({
      inputs: [],
      changeAddress: receiverAddress,
    });
  }

  // sorting utxo from higher to lower ADA value
  // to minimize the number of utxo use in transaction
  const sortedUtxos = cardanoResources.utxos.sort((a, b) => {
    const diff = b.amount.minus(a.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });

  const transactionInputs: Array<TyphonTypes.Input> = [];
  const usedUtxoAdaAmount = new BigNumber(0);
  // Add 10 ADA as buffer for utxo selection to cover the transaction fees.
  const requiredInputAmount = transaction.amount.plus(10e6);
  for (let i = 0; i < sortedUtxos.length && usedUtxoAdaAmount.lte(requiredInputAmount); i++) {
    const utxo = sortedUtxos[i];
    const transactionInput = getTyphonInputFromUtxo(utxo);
    transactionInputs.push(transactionInput);
    usedUtxoAdaAmount.plus(transactionInput.amount);
  }

  const rewardsWithdrawalCertificate = getRewardWithdrawalCertificate(account);
  if (rewardsWithdrawalCertificate) typhonTx.addWithdrawal(rewardsWithdrawalCertificate);

  typhonTx.addOutput({
    address: receiverAddress,
    amount: transaction.amount,
    tokens: [],
  });

  return typhonTx.prepareTransaction({
    inputs: transactionInputs,
    changeAddress,
  });
};

const buildDelegateTransaction = async ({
  account,
  transaction,
  typhonTx,
  changeAddress,
}: {
  account: CardanoAccount;
  transaction: Transaction;
  typhonTx: TyphonTransaction;
  changeAddress: TyphonTypes.CardanoAddress;
}): Promise<TyphonTransaction> => {
  const cardanoResources = account.cardanoResources as CardanoResources;

  const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
  const stakeKeyHashCredential: TyphonTypes.HashCredential = {
    hash: Buffer.from(stakeCredential.key, "hex"),
    type: TyphonTypes.HashType.ADDRESS,
    bipPath: stakeCredential.path,
  };

  if (!cardanoResources.delegation || !cardanoResources.delegation.status) {
    const stakeRegistrationCert: TyphonTypes.StakeRegistrationCertificate = {
      certType: TyphonTypes.CertificateType.STAKE_REGISTRATION,
      stakeCredential: stakeKeyHashCredential,
    };
    typhonTx.addCertificate(stakeRegistrationCert);
  }

  const delegationCert: TyphonTypes.StakeDelegationCertificate = {
    certType: TyphonTypes.CertificateType.STAKE_DELEGATION,
    stakeCredential: stakeKeyHashCredential,
    poolHash: transaction.poolId as string,
  };
  typhonTx.addCertificate(delegationCert);

  // sorting utxo from higher to lower ADA value
  // to minimize the number of utxo use in transaction
  const sortedUtxos = cardanoResources.utxos.sort((a, b) => {
    const diff = b.amount.minus(a.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });

  const transactionInputs: Array<TyphonTypes.Input> = [];
  const usedUtxoAdaAmount = new BigNumber(0);
  // Add 10 ADA as buffer for utxo selection to cover the transaction fees.
  const requiredInputAmount = transaction.amount.plus(10e6);
  for (let i = 0; i < sortedUtxos.length && usedUtxoAdaAmount.lte(requiredInputAmount); i++) {
    const utxo = sortedUtxos[i];
    const transactionInput = getTyphonInputFromUtxo(utxo);
    transactionInputs.push(transactionInput);
    usedUtxoAdaAmount.plus(transactionInput.amount);
  }

  const rewardsWithdrawalCertificate = getRewardWithdrawalCertificate(account);
  if (rewardsWithdrawalCertificate) typhonTx.addWithdrawal(rewardsWithdrawalCertificate);

  return typhonTx.prepareTransaction({
    inputs: transactionInputs,
    changeAddress,
  });
};

const buildUndelegateTransaction = async ({
  account,
  transaction,
  typhonTx,
  changeAddress,
}: {
  account: CardanoAccount;
  transaction: Transaction;
  typhonTx: TyphonTransaction;
  changeAddress: TyphonTypes.CardanoAddress;
}): Promise<TyphonTransaction> => {
  const cardanoResources = account.cardanoResources as CardanoResources;

  const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
  const stakeKeyHashCredential: TyphonTypes.HashCredential = {
    hash: Buffer.from(stakeCredential.key, "hex"),
    type: TyphonTypes.HashType.ADDRESS,
    bipPath: stakeCredential.path,
  };

  if (!cardanoResources.delegation || !cardanoResources.delegation.status) {
    throw new Error("StakeKey is not registered");
  }

  const rewardsWithdrawalCertificate = getRewardWithdrawalCertificate(account);
  if (rewardsWithdrawalCertificate) typhonTx.addWithdrawal(rewardsWithdrawalCertificate);

  const stakeKeyDeRegistrationCertificate: TyphonTypes.StakeDeRegistrationCertificate = {
    certType: TyphonTypes.CertificateType.STAKE_DE_REGISTRATION,
    stakeCredential: stakeKeyHashCredential,
  };
  typhonTx.addCertificate(stakeKeyDeRegistrationCertificate);

  // sorting utxo from higher to lower ADA value
  // to minimize the number of utxo use in transaction
  const sortedUtxos = cardanoResources.utxos.sort((a, b) => {
    const diff = b.amount.minus(a.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });

  const transactionInputs: Array<TyphonTypes.Input> = [];
  const usedUtxoAdaAmount = new BigNumber(0);
  // Add 10 ADA as buffer for utxo selection to cover the transaction fees.
  const requiredInputAmount = transaction.amount.plus(10e6);
  for (let i = 0; i < sortedUtxos.length && usedUtxoAdaAmount.lte(requiredInputAmount); i++) {
    const utxo = sortedUtxos[i];
    const transactionInput = getTyphonInputFromUtxo(utxo);
    transactionInputs.push(transactionInput);
    usedUtxoAdaAmount.plus(transactionInput.amount);
  }

  return typhonTx.prepareTransaction({
    inputs: transactionInputs,
    changeAddress,
  });
};

/**
 *
 * @param {CardanoAccount} account
 * @param {Transaction} transaction
 *
 * @returns {TyphonTransaction}
 */
export const buildTransaction = async (
  account: CardanoAccount,
  transaction: Transaction,
): Promise<TyphonTransaction> => {
  const cardanoResources = account.cardanoResources as CardanoResources;
  const { protocolParams } = transaction;

  if (!protocolParams || !isProtocolParamsValid(protocolParams)) {
    throw new CardanoInvalidProtoParams();
  }

  const typhonTx = new TyphonTransaction({
    protocolParams: {
      minFeeA: new BigNumber(protocolParams.minFeeA),
      minFeeB: new BigNumber(protocolParams.minFeeB),
      stakeKeyDeposit: new BigNumber(protocolParams.stakeKeyDeposit),
      lovelacePerUtxoWord: new BigNumber(protocolParams.lovelacePerUtxoWord),
      collateralPercent: new BigNumber(protocolParams.collateralPercent),
      priceSteps: new BigNumber(protocolParams.priceSteps),
      priceMem: new BigNumber(protocolParams.priceMem),
      languageView: protocolParams.languageView,
      maxTxSize: Number(protocolParams.maxTxSize),
      maxValueSize: Number(protocolParams.maxValueSize),
      utxoCostPerByte: new BigNumber(protocolParams.utxoCostPerByte),
    },
  });
  const ttl = getTTL(account.currency.id);
  typhonTx.setTTL(ttl);

  const metadata: Array<TyphonTypes.Metadata> = [];
  if (transaction.memo) {
    metadata.push({
      label: 674,
      data: new Map([["msg", [transaction.memo]]]),
    });
  }
  if (metadata.length) {
    typhonTx.setAuxiliaryData({ metadata });
  }

  const networkParams = getNetworkParameters(account.currency.id);
  const unusedInternalCred = cardanoResources.internalCredentials.find(
    cred => !cred.isUsed,
  ) as PaymentCredential;

  const changeAddress = getBaseAddress({
    networkId: networkParams.networkId,
    paymentCred: unusedInternalCred,
    stakeCred: getAccountStakeCredential(account.xpub as string, account.index),
  });

  if (transaction.mode === "send") {
    const receiverAddress = TyphonUtils.getAddressFromString(transaction.recipient);
    if (transaction.subAccountId) {
      // Token Transaction
      const tokenAccount = account.subAccounts
        ? account.subAccounts.find(a => {
            return a.id === transaction.subAccountId;
          })
        : undefined;

      if (!tokenAccount || tokenAccount.type !== "TokenAccount") {
        throw new Error("TokenAccount not found");
      }

      return buildSendTokenTransaction({
        account,
        transaction,
        tokenAccount,
        typhonTx,
        receiverAddress,
        changeAddress,
      });
    }
    // Normal ADA Transaction
    return buildSendAdaTransaction({
      account,
      transaction,
      typhonTx,
      receiverAddress,
      changeAddress,
    });
  } else if (transaction.mode === "delegate") {
    return buildDelegateTransaction({ account, transaction, typhonTx, changeAddress });
  } else if (transaction.mode === "undelegate") {
    return buildUndelegateTransaction({ account, transaction, typhonTx, changeAddress });
  } else {
    throw new Error("Invalid transaction mode");
  }
};
