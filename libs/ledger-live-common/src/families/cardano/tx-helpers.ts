import {
  AddressType,
  CertificateType,
  StakeCredentialParamsType,
  StakeDelegationParams,
  StakeRegistrationParams,
  StakeDeregistrationParams,
  TxInput,
  TxOutput,
  TxOutputDestination,
  TxOutputDestinationType,
  Withdrawal,
  StakeCredentialParams,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils/address";
import {
  SignerTxCertificate,
  SignerTxInput,
  SignerTxOutput,
  SignerTxWithdrawal,
} from "@ledgerhq/coin-cardano/signer";

/**
 * returns the formatted transactionInput for ledger cardano app
 *
 * @param {TyphonTypes.Input} input
 * @param {number} accountIndex
 * @returns {TxInput}
 */
export function prepareLedgerInput({ txHashHex, outputIndex, path }: SignerTxInput): TxInput {
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
export function prepareLedgerOutput(output: SignerTxOutput): TxOutput {
  const { amount, tokenBundle } = output;

  const destination = convertDestination(output);

  return {
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

export function prepareCertificate(cert: SignerTxCertificate):
  | {
      type: CertificateType.STAKE_REGISTRATION;
      params: StakeRegistrationParams;
    }
  | {
      type: CertificateType.STAKE_DELEGATION;
      params: StakeDelegationParams;
    }
  | {
      type: CertificateType.STAKE_DEREGISTRATION;
      params: StakeDeregistrationParams;
    } {
  const stakeCredential: StakeCredentialParams = {
    type: StakeCredentialParamsType.KEY_PATH,
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
    default:
      throw new Error("Invalid Certificate type");
  }
}

export function prepareWithdrawal({ stakeCredential, amount }: SignerTxWithdrawal): Withdrawal {
  return {
    stakeCredential: {
      type: StakeCredentialParamsType.KEY_PATH,
      keyPath: str_to_path(stakeCredential.keyPath),
    },
    amount,
  };
}
