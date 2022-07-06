import {
  CardanoAccount,
  CardanoOutput,
  CardanoResources,
  PaymentCredential,
  Token,
  Transaction,
} from "./types";
import type { TokenAccount } from "@ledgerhq/types-live";
import {
  Transaction as TyphonTransaction,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import {
  getAccountStakeCredential,
  getBaseAddress,
  getTTL,
  mergeTokens,
} from "./logic";
import { getNetworkParameters } from "./networks";
import {
  decodeTokenAssetId,
  decodeTokenCurrencyId,
  getTokenAssetId,
} from "./buildSubAccounts";

function getTyphonInputFromUtxo(utxo: CardanoOutput): TyphonTypes.Input {
  const address = TyphonUtils.getAddressFromHex(
    utxo.address
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

const buildSendTokenTransaction = async ({
  a,
  t,
  tokenAccount,
  typhonTx,
  receiverAddress,
  changeAddress,
}: {
  a: CardanoAccount;
  t: Transaction;
  tokenAccount: TokenAccount;
  typhonTx: TyphonTransaction;
  receiverAddress: TyphonTypes.CardanoAddress;
  changeAddress: TyphonTypes.CardanoAddress;
}): Promise<TyphonTransaction> => {
  const cardanoResources = a.cardanoResources as CardanoResources;

  const { assetId } = decodeTokenCurrencyId(tokenAccount.token.id);
  const { policyId, assetName } = decodeTokenAssetId(assetId);
  const transactionAmount = t.useAllAmount ? tokenAccount.balance : t.amount;

  const tokensToSend = [
    {
      policyId,
      assetName,
      amount: transactionAmount,
    },
  ];
  const tokenUtxos: Array<CardanoOutput> = [];
  const otherUtxos: Array<CardanoOutput> = [];

  cardanoResources.utxos.forEach((u) => {
    if (u.tokens.some((t) => getTokenAssetId(t) === assetId)) {
      tokenUtxos.push(u);
    } else {
      otherUtxos.push(u);
    }
  });
  const sortedTokenUtxo = tokenUtxos.sort((a, b) => {
    const sendingTokenA = a.tokens.find(
      (t) => getTokenAssetId(t) === assetId
    ) as Token;
    const sendingTokenB = b.tokens.find(
      (t) => getTokenAssetId(t) === assetId
    ) as Token;
    const diff = sendingTokenB.amount.minus(sendingTokenA.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });
  const sortedOtherUtxos = otherUtxos.sort((a, b) => {
    const diff = b.amount.minus(a.amount);
    return diff.eq(0) ? 0 : diff.lt(0) ? -1 : 1;
  });

  const totalAddedTokenAmount = new BigNumber(0);
  const requiredMinAdaForTokens = TyphonUtils.calculateMinUtxoAmount(
    tokensToSend,
    new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord)
  );
  // Add enough utxo to cover token amount
  for (let i = 0; i < sortedTokenUtxo.length; i++) {
    const u = sortedTokenUtxo[i];
    const sendingToken = u.tokens.find(
      (t) => getTokenAssetId(t) === assetId
    ) as Token;
    typhonTx.addInput(getTyphonInputFromUtxo(u));
    totalAddedTokenAmount.plus(sendingToken.amount);
    if (totalAddedTokenAmount.gte(transactionAmount)) break;
  }
  // Add enough utxos to cover the transaction fees
  for (let i = 0; i < sortedOtherUtxos.length; i++) {
    const u = sortedOtherUtxos[i];
    if (typhonTx.getInputAmount().ada.gte(requiredMinAdaForTokens.plus(5e6))) {
      break;
    }
    typhonTx.addInput(getTyphonInputFromUtxo(u));
  }

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
  a,
  t,
  typhonTx,
  receiverAddress,
  changeAddress,
}: {
  a: CardanoAccount;
  t: Transaction;
  typhonTx: TyphonTransaction;
  receiverAddress: TyphonTypes.CardanoAddress;
  changeAddress: TyphonTypes.CardanoAddress;
}): Promise<TyphonTransaction> => {
  const cardanoResources = a.cardanoResources as CardanoResources;
  const protocolParams = cardanoResources.protocolParams;

  if (t.useAllAmount) {
    // add all utxo as input
    cardanoResources.utxos.forEach((u) =>
      typhonTx.addInput(getTyphonInputFromUtxo(u))
    );

    const tokenBalance = mergeTokens(
      cardanoResources.utxos.map((u) => u.tokens).flat()
    );

    // if account holds any tokens then add it to changeAddress,
    // with minimum required ADA to spend those tokens
    if (tokenBalance.length) {
      const minAmountToSpendTokens = TyphonUtils.calculateMinUtxoAmount(
        tokenBalance,
        new BigNumber(protocolParams.lovelacePerUtxoWord),
        false
      );
      typhonTx.addOutput({
        address: changeAddress,
        amount: minAmountToSpendTokens,
        tokens: tokenBalance,
      });
    }

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
  // Add 5 ADA as buffer for utxo selection to cover the transaction fees.
  const requiredInputAmount = t.amount.plus(5e6);
  for (
    let i = 0;
    i < sortedUtxos.length && usedUtxoAdaAmount.lte(requiredInputAmount);
    i++
  ) {
    const utxo = sortedUtxos[i];
    const transactionInput = getTyphonInputFromUtxo(utxo);
    transactionInputs.push(transactionInput);
    usedUtxoAdaAmount.plus(transactionInput.amount);
  }

  typhonTx.addOutput({
    address: receiverAddress,
    amount: t.amount,
    tokens: [],
  });

  return typhonTx.prepareTransaction({
    inputs: transactionInputs,
    changeAddress,
  });
};

/**
 *
 * @param {CardanoAccount} a
 * @param {Transaction} t
 *
 * @returns {TyphonTransaction}
 */
export const buildTransaction = async (
  a: CardanoAccount,
  t: Transaction
): Promise<TyphonTransaction> => {
  const cardanoResources = a.cardanoResources as CardanoResources;
  const protocolParams = cardanoResources.protocolParams;

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
    },
  });
  const ttl = getTTL(a.currency.id);
  typhonTx.setTTL(ttl);

  const metadata: Array<TyphonTypes.Metadata> = [];
  if (t.memo) {
    metadata.push({
      label: 674,
      data: new Map([["msg", [t.memo]]]),
    });
  }
  if (metadata.length) {
    typhonTx.setAuxiliaryData({ metadata });
  }

  const networkParams = getNetworkParameters(a.currency.id);
  const receiverAddress = TyphonUtils.getAddressFromBech32(t.recipient);
  const unusedInternalCred = cardanoResources.internalCredentials.find(
    (cred) => !cred.isUsed
  ) as PaymentCredential;

  const changeAddress = getBaseAddress({
    networkId: networkParams.networkId,
    paymentCred: unusedInternalCred,
    stakeCred: getAccountStakeCredential(a.xpub as string, a.index),
  });

  if (t.subAccountId) {
    const tokenAccount = a.subAccounts
      ? a.subAccounts.find((a) => {
          return a.id === t.subAccountId;
        })
      : undefined;

    if (!tokenAccount || tokenAccount.type !== "TokenAccount") {
      throw new Error("TokenAccount not found");
    }

    return buildSendTokenTransaction({
      a,
      t,
      tokenAccount,
      typhonTx,
      receiverAddress,
      changeAddress,
    });
  }
  return buildSendAdaTransaction({
    a,
    t,
    typhonTx,
    receiverAddress,
    changeAddress,
  });
};
