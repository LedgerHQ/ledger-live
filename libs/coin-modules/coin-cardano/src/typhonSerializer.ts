import {
  types as TyphonTypes,
  address as TyphonAddress,
  Transaction as TyphonTransaction,
} from "@stricahq/typhonjs";
import groupBy from "lodash/groupBy";
import { getBipPathString } from "./logic";
import { CertificateType } from "@stricahq/typhonjs/dist/types";
import {
  CardanoTxOutputFormat,
  SignerTxCertificate,
  SignerTxInput,
  SignerTxOutput,
  SignerTxWithdrawal,
} from "./signer";

/**
 * Convert StricaTypes Transaction into a simpler types.
 * We are keeping the minimal necessary for a signer.
 */
export default function (transaction: TyphonTransaction, accountIndex: number) {
  const ledgerAppInputs = transaction.getInputs().map(prepareLedgerInput(accountIndex));
  const ledgerAppOutputs = transaction.getOutputs().map(prepareLedgerOutput(accountIndex));
  const ledgerCertificates = transaction.getCertificates().map(prepareCertificate);
  const ledgerWithdrawals = transaction.getWithdrawals().map(prepareWithdrawal);
  const auxiliaryDataHashHex = transaction.getAuxiliaryDataHashHex();

  return {
    inputs: ledgerAppInputs,
    outputs: ledgerAppOutputs,
    certificates: ledgerCertificates,
    withdrawals: ledgerWithdrawals,
    fee: transaction.getFee().toString(),
    ttl: transaction.getTTL()?.toString(),
    validityIntervalStart: null,
    auxiliaryData: auxiliaryDataHashHex ?? null,
  };
}

/**
 * returns the formatted transactionInput for ledger cardano app
 *
 * @param {TyphonTypes.Input} input
 * @param {number} accountIndex
 * @returns {TxInput}
 */
const prepareLedgerInput =
  (accountIndex: number) =>
  (input: TyphonTypes.Input): SignerTxInput => {
    const paymentKeyPath =
      input.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS
        ? input.address.paymentCredential.bipPath
        : undefined;
    return {
      txHashHex: input.txId,
      outputIndex: input.index,
      path: paymentKeyPath
        ? getBipPathString({
            account: accountIndex,
            chain: paymentKeyPath.chain,
            index: paymentKeyPath.index,
          })
        : null,
    };
  };

/**
 * returns the formatted transactionOutput for ledger cardano app
 *
 * @param output
 * @param accountIndex
 * @returns {TxOutput}
 */
const prepareLedgerOutput =
  (accountIndex: number) =>
  (output: TyphonTypes.Output): SignerTxOutput => {
    const isByronAddress = output.address instanceof TyphonAddress.ByronAddress;
    let isDeviceOwnedAddress = false;

    if (!isByronAddress) {
      const address = output.address as TyphonTypes.ShelleyAddress;
      isDeviceOwnedAddress =
        address.paymentCredential &&
        address.paymentCredential.type === TyphonTypes.HashType.ADDRESS &&
        address.paymentCredential.bipPath !== undefined;
    }

    let destination;
    if (isDeviceOwnedAddress) {
      const address = output.address as TyphonAddress.BaseAddress;

      const paymentKeyPath = (address.paymentCredential as TyphonTypes.HashCredential)
        .bipPath as TyphonTypes.BipPath;
      const stakingKeyPath = (address.stakeCredential as TyphonTypes.HashCredential)
        .bipPath as TyphonTypes.BipPath;

      const paymentKeyPathString = getBipPathString({
        account: accountIndex,
        chain: paymentKeyPath.chain,
        index: paymentKeyPath.index,
      });
      const stakingKeyPathString = getBipPathString({
        account: accountIndex,
        chain: stakingKeyPath.chain,
        index: stakingKeyPath.index,
      });

      destination = {
        isDeviceOwnedAddress,
        params: {
          spendingPath: paymentKeyPathString,
          stakingPath: stakingKeyPathString,
        },
      };
    } else {
      const address = output.address;
      destination = {
        isDeviceOwnedAddress,
        params: {
          addressHex: address.getHex(),
        },
      };
    }

    const tokenBundle = Object.values(groupBy(output.tokens, ({ policyId }) => policyId)).map(
      tokens => ({
        policyIdHex: tokens[0].policyId,
        tokens: tokens.map(token => ({
          assetNameHex: token.assetName,
          amount: token.amount.toString(),
        })),
      }),
    );

    return {
      format: CardanoTxOutputFormat.MAP_BABBAGE,
      amount: output.amount.toString(),
      destination,
      tokenBundle,
    };
  };

function prepareCertificate(cert: TyphonTypes.Certificate): SignerTxCertificate {
  if (cert.certType === CertificateType.STAKE_REGISTRATION) {
    return prepareStakeRegistrationCertificate(cert as TyphonTypes.StakeRegistrationCertificate);
  } else if (cert.certType === CertificateType.STAKE_DELEGATION) {
    return prepareStakeDelegationCertificate(cert as TyphonTypes.StakeDelegationCertificate);
  } else if (cert.certType === CertificateType.STAKE_DE_REGISTRATION) {
    return prepareStakeDeRegistrationCertificate(
      cert as TyphonTypes.StakeDeRegistrationCertificate,
    );
  } else {
    throw new Error("Invalid Certificate type");
  }
}

function prepareStakeRegistrationCertificate(
  certificate: TyphonTypes.StakeRegistrationCertificate,
): {
  type: "REGISTRATION";
  params: {
    stakeCredential: {
      keyPath: string;
    };
  };
} {
  if (
    certificate.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    certificate.stakeCredential.bipPath
  ) {
    return {
      type: "REGISTRATION",
      params: {
        stakeCredential: {
          keyPath: getBipPathString({
            account: certificate.stakeCredential.bipPath.account,
            chain: certificate.stakeCredential.bipPath.chain,
            index: certificate.stakeCredential.bipPath.index,
          }),
        },
      },
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}

function prepareStakeDelegationCertificate(certificate: TyphonTypes.StakeDelegationCertificate): {
  type: "DELEGATION";
  params: {
    stakeCredential: {
      keyPath: string;
    };
    poolKeyHashHex: string;
  };
} {
  if (
    certificate.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    certificate.stakeCredential.bipPath
  ) {
    return {
      type: "DELEGATION",
      params: {
        stakeCredential: {
          keyPath: getBipPathString({
            account: certificate.stakeCredential.bipPath.account,
            chain: certificate.stakeCredential.bipPath.chain,
            index: certificate.stakeCredential.bipPath.index,
          }),
        },
        poolKeyHashHex: certificate.poolHash,
      },
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}

function prepareStakeDeRegistrationCertificate(certificate: TyphonTypes.Certificate): {
  type: "DEREGISTRATION";
  params: {
    stakeCredential: {
      keyPath: string;
    };
  };
} {
  if (
    certificate.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    certificate.stakeCredential.bipPath
  ) {
    return {
      type: "DEREGISTRATION",
      params: {
        stakeCredential: {
          keyPath: getBipPathString({
            account: certificate.stakeCredential.bipPath.account,
            chain: certificate.stakeCredential.bipPath.chain,
            index: certificate.stakeCredential.bipPath.index,
          }),
        },
      },
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}

function prepareWithdrawal(withdrawal: TyphonTypes.Withdrawal): SignerTxWithdrawal {
  if (
    withdrawal.rewardAccount.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    withdrawal.rewardAccount.stakeCredential.bipPath
  ) {
    return {
      stakeCredential: {
        keyPath: getBipPathString({
          account: withdrawal.rewardAccount.stakeCredential.bipPath.account,
          chain: withdrawal.rewardAccount.stakeCredential.bipPath.chain,
          index: withdrawal.rewardAccount.stakeCredential.bipPath.index,
        }),
      },
      amount: withdrawal.amount.toString(),
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}
