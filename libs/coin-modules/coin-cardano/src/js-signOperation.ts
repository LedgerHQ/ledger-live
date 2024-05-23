import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import { Transaction as TyphonTransaction, types as TyphonTypes } from "@stricahq/typhonjs";
import ShelleyTypeAddress from "@stricahq/typhonjs/dist/address/ShelleyTypeAddress";
import { HashType } from "@stricahq/typhonjs/dist/types";
import { OperationType, SignOperationEvent, SignOperationFnSignature } from "@ledgerhq/types-live";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { MEMO_LABEL } from "./constants";
import { buildTransaction } from "./js-buildTransaction";
import { getAccountStakeCredential, getExtendedPublicKeyFromHex, getOperationType } from "./logic";
import { getNetworkParameters } from "./networks";
import { CardanoSigner, Witness } from "./signer";
import type {
  CardanoAccount,
  CardanoOperation,
  CardanoOperationExtra,
  CardanoResources,
  Transaction,
} from "./types";
import typhonSerializer from "./typhonSerializer";

const buildOptimisticOperation = (
  account: CardanoAccount,
  transaction: TyphonTransaction,
  t: Transaction,
): CardanoOperation => {
  const cardanoResources = account.cardanoResources as CardanoResources;
  const accountCreds = new Set(
    [...cardanoResources.externalCredentials, ...cardanoResources.internalCredentials].map(
      cred => cred.key,
    ),
  );
  const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
  const protocolParams = account.cardanoResources.protocolParams;

  const accountInput = transaction
    .getInputs()
    .reduce(
      (total, i) =>
        accountCreds.has(i.address.paymentCredential.hash) ? total.plus(i.amount) : total.plus(0),
      new BigNumber(0),
    );

  const accountOutput = transaction
    .getOutputs()
    .reduce(
      (total, o) =>
        o.address instanceof ShelleyTypeAddress &&
        accountCreds.has(o.address.paymentCredential.hash)
          ? total.plus(o.amount)
          : total.plus(0),
      new BigNumber(0),
    );

  const txCertificates = transaction.getCertificates();
  const stakeRegistrationCertificates = txCertificates.filter(
    c => c.certType === TyphonTypes.CertificateType.STAKE_REGISTRATION,
  );
  const stakeDeRegistrationCertificates = txCertificates.filter(
    c => c.certType === TyphonTypes.CertificateType.STAKE_DE_REGISTRATION,
  );
  const txWithdrawals = transaction.getWithdrawals();

  const transactionHash = transaction.getTransactionHash().toString("hex");
  const auxiliaryData = transaction.getAuxiliaryData();
  const extra: CardanoOperationExtra = {};
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
        c.stakeCredential.type === HashType.ADDRESS &&
        c.stakeCredential.hash === stakeCredential.key,
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

  if (stakeDeRegistrationCertificates.length) {
    const walletDeRegistration = stakeDeRegistrationCertificates.find(
      c =>
        c.stakeCredential.type === HashType.ADDRESS &&
        c.stakeCredential.hash === stakeCredential.key,
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

  if (txWithdrawals && txWithdrawals.length) {
    const walletWithdraw = txWithdrawals.find(
      w =>
        w.rewardAccount.stakeCredential.type === HashType.ADDRESS &&
        w.rewardAccount.stakeCredential.hash === stakeCredential.key,
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
    c => c.certType === TyphonTypes.CertificateType.STAKE_DELEGATION,
  )
    ? "DELEGATE"
    : txCertificates.find(c => c.certType === TyphonTypes.CertificateType.STAKE_DE_REGISTRATION)
      ? "UNDELEGATE"
      : getOperationType({
          valueChange: operationValue,
          fees: transaction.getFee(),
        });

  const op: CardanoOperation = {
    id: encodeOperationId(account.id, transactionHash, opType),
    hash: transactionHash,
    type: opType,
    value: operationValue.absoluteValue(),
    fee: transaction.getFee(),
    blockHash: undefined,
    blockHeight: null,
    senders: transaction.getInputs().map(i => i.address.getBech32()),
    recipients: transaction.getOutputs().map(o => o.address.getBech32()),
    accountId: account.id,
    date: new Date(),
    extra,
  };

  const tokenAccount = t.subAccountId
    ? account.subAccounts?.find(ta => ta.id === t.subAccountId)
    : null;

  if (tokenAccount && opType === "OUT") {
    op.subOperations = [
      {
        id: encodeOperationId(tokenAccount.id, transactionHash, opType),
        hash: transactionHash,
        type: opType,
        value: t.useAllAmount ? tokenAccount.balance : t.amount,
        fee: t.fees as BigNumber,
        blockHash: undefined,
        blockHeight: null,
        senders: transaction.getInputs().map(i => i.address.getBech32()),
        recipients: transaction.getOutputs().map(o => o.address.getBech32()),
        accountId: tokenAccount.id,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return op;
};

/**
 * Sign Transaction with Ledger hardware
 */
const buildSignOperation =
  (signerContext: SignerContext<CardanoSigner>): SignOperationFnSignature<Transaction> =>
  ({ account, deviceId, transaction }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        o.next({ type: "device-signature-requested" });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const unsignedTransaction = await buildTransaction(account as CardanoAccount, transaction);
        const signerTransaction = typhonSerializer(unsignedTransaction, account.index);

        const networkParams = getNetworkParameters(account.currency.id);
        const signedData = await signerContext(deviceId, signer =>
          signer.sign({
            transaction: signerTransaction,
            networkParams,
          }),
        );

        const accountPubKey = getExtendedPublicKeyFromHex(account.xpub as string);
        const signed = signTx(unsignedTransaction, accountPubKey, signedData.witnesses);

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account as CardanoAccount,
          unsignedTransaction,
          transaction,
        );

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed.payload,
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

/**
 * Adds signatures to unsigned transaction
 */
const signTx = (
  unsignedTransaction: TyphonTransaction,
  accountKey: Bip32PublicKey,
  witnesses: Array<Witness>,
) => {
  witnesses.forEach(witness => {
    const [, , , chainType, index] = witness.path;
    const publicKey = accountKey.derive(chainType).derive(index).toPublicKey().toBytes();
    const vKeyWitness: TyphonTypes.VKeyWitness = {
      signature: Buffer.from(witness.witnessSignatureHex, "hex"),
      publicKey: Buffer.from(publicKey),
    };
    unsignedTransaction.addWitness(vKeyWitness);
  });

  return unsignedTransaction.buildTransaction();
};

export default buildSignOperation;
