import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import Ada, {
  CertificateType,
  Networks,
  SignTransactionRequest,
  TransactionSigningMode,
  TxAuxiliaryDataType,
  Witness,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import { types as TyphonTypes, Transaction as TyphonTransaction } from "@stricahq/typhonjs";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { CardanoAccount, Transaction } from "./types";
import { getExtendedPublicKeyFromHex } from "./logic";
import { buildTransaction } from "./buildTransaction";
import { withDevice } from "../../hw/deviceAccess";
import { getNetworkParameters } from "./networks";
import {
  prepareStakeDelegationCertificate,
  prepareLedgerInput,
  prepareLedgerOutput,
  prepareStakeRegistrationCertificate,
  prepareStakeDeRegistrationCertificate,
  prepareWithdrawal,
} from "./tx-helpers";

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation: AccountBridge<Transaction, CardanoAccount>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          o.next({ type: "device-signature-requested" });

          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          const unsignedTransaction = await buildTransaction(account, transaction);

          const accountPubKey = getExtendedPublicKeyFromHex(account.xpub as string);

          const rawInputs = unsignedTransaction.getInputs();
          const ledgerAppInputs = rawInputs.map(i => prepareLedgerInput(i, account.index));

          const rawOutptus = unsignedTransaction.getOutputs();
          const ledgerAppOutputs = rawOutptus.map(o => prepareLedgerOutput(o, account.index));

          const rawCertificates = unsignedTransaction.getCertificates();
          const ledgerCertificates = rawCertificates.map(rcert => {
            if (rcert.certType === (CertificateType.STAKE_REGISTRATION as number)) {
              return prepareStakeRegistrationCertificate(
                rcert as TyphonTypes.StakeRegistrationCertificate,
              );
            } else if (rcert.certType === (CertificateType.STAKE_DELEGATION as number)) {
              return prepareStakeDelegationCertificate(
                rcert as TyphonTypes.StakeDelegationCertificate,
              );
            } else if (rcert.certType === (CertificateType.STAKE_DEREGISTRATION as number)) {
              return prepareStakeDeRegistrationCertificate(
                rcert as TyphonTypes.StakeDeRegistrationCertificate,
              );
            } else {
              throw new Error("Invalid Certificate type");
            }
          });

          const rawWithdrawals = unsignedTransaction.getWithdrawals();
          const ledgerWithdrawals = rawWithdrawals.map(prepareWithdrawal);

          const auxiliaryDataHashHex = unsignedTransaction.getAuxiliaryDataHashHex();

          const networkParams = getNetworkParameters(account.currency.id);
          const network =
            networkParams.networkId === Networks.Mainnet.networkId
              ? Networks.Mainnet
              : Networks.Testnet;

          const trxOptions: SignTransactionRequest = {
            signingMode: TransactionSigningMode.ORDINARY_TRANSACTION,
            tx: {
              network,
              inputs: ledgerAppInputs,
              outputs: ledgerAppOutputs,
              certificates: ledgerCertificates,
              withdrawals: ledgerWithdrawals,
              fee: unsignedTransaction.getFee().toString(),
              ttl: unsignedTransaction.getTTL()?.toString(),
              validityIntervalStart: null,
              auxiliaryData: auxiliaryDataHashHex
                ? {
                    type: TxAuxiliaryDataType.ARBITRARY_HASH,
                    params: {
                      hashHex: auxiliaryDataHashHex,
                    },
                  }
                : null,
            },
            additionalWitnessPaths: [],
          };

          // Sign by device
          const appAda = new Ada(transport);
          const r = await appAda.signTransaction(trxOptions);
          const signed = signTx(unsignedTransaction, accountPubKey, r.witnesses);

          o.next({ type: "device-signature-granted" });

          const operation = buildOptimisticOperation(account, unsignedTransaction, transaction);

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
      }),
  );

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

export default signOperation;
