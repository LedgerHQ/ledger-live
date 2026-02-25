import BigNumber from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { HashType } from "@stricahq/typhonjs/dist/types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import ShelleyTypeAddress from "@stricahq/typhonjs/dist/address/ShelleyTypeAddress";
import { types as TyphonTypes, Transaction as TyphonTransaction } from "@stricahq/typhonjs";
import { getAccountStakeCredential, getOperationType } from "./logic";
import { MEMO_LABEL } from "./constants";
import {
  CardanoAccount,
  CardanoOperation,
  CardanoOperationExtra,
  CardanoResources,
  Transaction,
} from "./types";

export const buildOptimisticOperation = (
  account: CardanoAccount,
  unsignedTransaction: TyphonTransaction,
  transaction: Transaction,
): CardanoOperation => {
  const cardanoResources = account.cardanoResources as CardanoResources;
  const accountCreds = new Set(
    [...cardanoResources.externalCredentials, ...cardanoResources.internalCredentials].map(
      cred => cred.key,
    ),
  );
  const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
  const protocolParams = account.cardanoResources.protocolParams;

  const accountInput = unsignedTransaction
    .getInputs()
    .reduce(
      (total, i) =>
        accountCreds.has(i.address.paymentCredential.hash.toString("hex"))
          ? total.plus(i.amount)
          : total.plus(0),
      new BigNumber(0),
    );

  const accountOutput = unsignedTransaction
    .getOutputs()
    .reduce(
      (total, o) =>
        o.address instanceof ShelleyTypeAddress &&
        accountCreds.has(o.address.paymentCredential.hash.toString("hex"))
          ? total.plus(o.amount)
          : total.plus(0),
      new BigNumber(0),
    );

  const txCertificates = unsignedTransaction.getCertificates();
  const stakeRegistrationCertificates: Array<TyphonTypes.StakeRegistrationCertificate> = [];
  const stakeDeRegistrationCertificates: Array<TyphonTypes.StakeDeRegistrationCertificate> = [];
  const stakeRegConwayCertificates: Array<TyphonTypes.StakeKeyRegistrationCertificate> = [];
  const stakeDeRegConwayCertificates: Array<TyphonTypes.StakeKeyDeRegistrationCertificate> = [];

  txCertificates.forEach(c => {
    switch (c.type) {
      case TyphonTypes.CertificateType.STAKE_REGISTRATION:
        stakeRegistrationCertificates.push(c);
        break;
      case TyphonTypes.CertificateType.STAKE_DE_REGISTRATION:
        stakeDeRegistrationCertificates.push(c);
        break;
      case TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION:
        stakeRegConwayCertificates.push(c);
        break;
      case TyphonTypes.CertificateType.STAKE_KEY_DE_REGISTRATION:
        stakeDeRegConwayCertificates.push(c);
        break;
    }
  });

  const txWithdrawals = unsignedTransaction.getWithdrawals();

  const transactionHash = unsignedTransaction.getTransactionHash().toString("hex");
  const auxiliaryData = unsignedTransaction.getAuxiliaryData();
  const extra: CardanoOperationExtra = {};

  // check for memo in auxiliary data
  if (auxiliaryData) {
    const memoMetadata = auxiliaryData.metadata.find(m => m.label === MEMO_LABEL);
    if (memoMetadata && memoMetadata.data instanceof Map) {
      const msg = memoMetadata.data.get("msg");
      if (Array.isArray(msg) && msg.length) {
        extra.memo = msg.join(", ");
      }
    }
  }

  let operationValue = accountOutput.minus(accountInput);

  if (stakeRegistrationCertificates.length) {
    const walletRegistration = stakeRegistrationCertificates.find(
      c =>
        c.cert.stakeCredential.type === HashType.ADDRESS &&
        c.cert.stakeCredential.hash.toString("hex") === stakeCredential.key,
    );
    if (walletRegistration) {
      extra.deposit = formatCurrencyUnit(
        account.currency.units[0],
        new BigNumber(protocolParams.stakeKeyDeposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  if (stakeRegConwayCertificates.length) {
    const walletRegistration = stakeRegConwayCertificates.find(
      c =>
        c.cert.stakeCredential.type === HashType.ADDRESS &&
        c.cert.stakeCredential.hash.toString("hex") === stakeCredential.key,
    );
    if (walletRegistration) {
      extra.deposit = formatCurrencyUnit(
        account.currency.units[0],
        new BigNumber(walletRegistration.cert.deposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  if (stakeDeRegistrationCertificates.length) {
    const walletDeRegistration = stakeDeRegistrationCertificates.find(
      c =>
        c.cert.stakeCredential.type === HashType.ADDRESS &&
        c.cert.stakeCredential.hash.toString("hex") === stakeCredential.key,
    );
    if (walletDeRegistration) {
      operationValue = operationValue.minus(protocolParams.stakeKeyDeposit);
      extra.refund = formatCurrencyUnit(
        account.currency.units[0],
        new BigNumber(protocolParams.stakeKeyDeposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  if (stakeDeRegConwayCertificates.length) {
    const walletDeRegistration = stakeDeRegConwayCertificates.find(
      c =>
        c.cert.stakeCredential.type === HashType.ADDRESS &&
        c.cert.stakeCredential.hash.toString("hex") === stakeCredential.key,
    );
    if (walletDeRegistration) {
      operationValue = operationValue.minus(walletDeRegistration.cert.deposit);
      extra.refund = formatCurrencyUnit(
        account.currency.units[0],
        new BigNumber(walletDeRegistration.cert.deposit),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  if (txWithdrawals && txWithdrawals.length) {
    const walletWithdraw = txWithdrawals.find(
      w =>
        w.rewardAccount.stakeCredential.type === HashType.ADDRESS &&
        w.rewardAccount.stakeCredential.hash.toString("hex") === stakeCredential.key,
    );
    if (walletWithdraw) {
      operationValue = operationValue.minus(walletWithdraw.amount);
      extra.rewards = formatCurrencyUnit(
        account.currency.units[0],
        new BigNumber(walletWithdraw.amount),
        {
          showCode: true,
          disableRounding: true,
        },
      );
    }
  }

  const opType: OperationType = txCertificates.find(
    c => c.type === TyphonTypes.CertificateType.STAKE_DELEGATION,
  )
    ? "DELEGATE"
    : txCertificates.find(c => c.type === TyphonTypes.CertificateType.STAKE_KEY_DE_REGISTRATION)
      ? "UNDELEGATE"
      : getOperationType({
          valueChange: operationValue,
          fees: unsignedTransaction.getFee(),
        });

  const op: CardanoOperation = {
    id: encodeOperationId(account.id, transactionHash, opType),
    hash: transactionHash,
    type: opType,
    value: operationValue.absoluteValue(),
    fee: unsignedTransaction.getFee(),
    blockHash: undefined,
    blockHeight: null,
    senders: unsignedTransaction.getInputs().map(i => i.address.getBech32()),
    recipients: unsignedTransaction.getOutputs().map(o => o.address.getBech32()),
    accountId: account.id,
    date: new Date(),
    extra,
  };

  const tokenAccount = transaction.subAccountId
    ? account.subAccounts?.find(ta => ta.id === transaction.subAccountId)
    : null;

  if (tokenAccount && opType === "OUT") {
    op.subOperations = [
      {
        id: encodeOperationId(tokenAccount.id, transactionHash, opType),
        hash: transactionHash,
        type: opType,
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: transaction.fees as BigNumber,
        blockHash: undefined,
        blockHeight: null,
        senders: unsignedTransaction.getInputs().map(i => i.address.getBech32()),
        recipients: unsignedTransaction.getOutputs().map(o => o.address.getBech32()),
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return op;
};
