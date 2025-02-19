import {
  AddressType,
  Certificate,
  CertificateType,
  Network,
  SignTransactionRequest,
  CredentialParams,
  CredentialParamsType,
  TransactionSigningMode,
  TxAuxiliaryDataType,
  TxInput,
  TxOutput,
  TxOutputDestination,
  TxOutputFormat,
  TxOutputDestinationType,
  Withdrawal,
  DRepParamsType,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils/address";
import {
  SignerTransaction,
  SignerTxCertificate,
  SignerTxInput,
  SignerTxOutput,
  SignerTxWithdrawal,
} from "@ledgerhq/coin-cardano/signer";

/**
 * Convert a CoinModule transaction format into a transaction to sign with Cardano Foundation signer.
 * @param network
 * @param transaction coming form CoinModule and will be converted to `SignTransactionRequest`
 * @returns
 */
export default function (network: Network, transaction: SignerTransaction): SignTransactionRequest {
  return {
    signingMode: TransactionSigningMode.ORDINARY_TRANSACTION,
    tx: {
      network,
      inputs: transaction.inputs.map(prepareLedgerInput),
      outputs: transaction.outputs.map(prepareLedgerOutput),
      certificates: transaction.certificates.map(prepareCertificate),
      withdrawals: transaction.withdrawals.map(prepareWithdrawal),
      fee: transaction.fee,
      ttl: transaction.ttl,
      validityIntervalStart: null,
      auxiliaryData: transaction.auxiliaryData
        ? {
            type: TxAuxiliaryDataType.ARBITRARY_HASH,
            params: {
              hashHex: transaction.auxiliaryData,
            },
          }
        : null,
    },
    additionalWitnessPaths: [],
  };
}

/**
 * returns the formatted transactionInput for ledger cardano app
 *
 * @param {TyphonTypes.Input} input
 * @param {number} accountIndex
 * @returns {TxInput}
 */
function prepareLedgerInput({ txHashHex, outputIndex, path }: SignerTxInput): TxInput {
  return {
    txHashHex,
    outputIndex,
    path: path ? str_to_path(path) : null,
  };
}

/**
 * returns the formatted transactionOutput for ledger cardano app
 *
 * @param output
 * @param accountIndex
 * @returns {TxOutput}
 */
function prepareLedgerOutput(output: SignerTxOutput): TxOutput {
  const { amount, tokenBundle } = output;
  const destination = convertDestination(output);

  return {
    format: TxOutputFormat.MAP_BABBAGE,
    amount,
    destination,
    tokenBundle,
  };
}

function convertDestination({ destination }: SignerTxOutput): TxOutputDestination {
  if (destination.isDeviceOwnedAddress) {
    return {
      type: TxOutputDestinationType.DEVICE_OWNED,
      params: {
        type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
        params: {
          spendingPath: str_to_path(destination.params.spendingPath),
          stakingPath: str_to_path(destination.params.stakingPath),
        },
      },
    };
  } else {
    return {
      type: TxOutputDestinationType.THIRD_PARTY,
      params: {
        addressHex: destination.params.addressHex,
      },
    };
  }
}

function prepareCertificate(cert: SignerTxCertificate): Certificate {
  const stakeCredential: CredentialParams = {
    type: CredentialParamsType.KEY_PATH,
    keyPath: str_to_path(cert.params.stakeCredential.keyPath),
  };

  switch (cert.type) {
    case "REGISTRATION":
      return {
        type: CertificateType.STAKE_REGISTRATION,
        params: {
          stakeCredential,
        },
      };
    case "DELEGATION":
      return {
        type: CertificateType.STAKE_DELEGATION,
        params: {
          stakeCredential,
          poolKeyHashHex: cert.params.poolKeyHashHex,
        },
      };
    case "DEREGISTRATION":
      return {
        type: CertificateType.STAKE_DEREGISTRATION,
        params: {
          stakeCredential,
        },
      };
    case "VOTE_DELEGATION_ABSTAIN":
      return {
        type: CertificateType.VOTE_DELEGATION,
        params: {
          stakeCredential,
          dRep: {
            type: DRepParamsType.ABSTAIN,
          },
        },
      };
    default:
      throw new Error("Invalid Certificate type");
  }
}

function prepareWithdrawal({ stakeCredential, amount }: SignerTxWithdrawal): Withdrawal {
  return {
    stakeCredential: {
      type: CredentialParamsType.KEY_PATH,
      keyPath: str_to_path(stakeCredential.keyPath),
    },
    amount,
  };
}
