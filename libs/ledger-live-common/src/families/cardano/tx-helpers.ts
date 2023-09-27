import {
  CertificateType,
  StakeCredentialParamsType,
  StakeDelegationParams,
  StakeRegistrationParams,
  StakeDeregistrationParams,
  Withdrawal,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils/address";
import { types as TyphonTypes, address as TyphonAddress } from "@stricahq/typhonjs";
import groupBy from "lodash/groupBy";
import {
  AddressType,
  AssetGroup,
  TxInput,
  TxOutput,
  TxOutputDestination,
  TxOutputDestinationType,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { getBipPathString } from "./logic";

/**
 * returns the formatted transactionInput for ledger cardano app
 *
 * @param {TyphonTypes.Input} input
 * @param {number} accountIndex
 * @returns {TxInput}
 */
export function prepareLedgerInput(input: TyphonTypes.Input, accountIndex: number): TxInput {
  const paymentKeyPath =
    input.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS
      ? input.address.paymentCredential.bipPath
      : undefined;
  return {
    txHashHex: input.txId,
    outputIndex: input.index,
    path: paymentKeyPath
      ? str_to_path(
          getBipPathString({
            account: accountIndex,
            chain: paymentKeyPath.chain,
            index: paymentKeyPath.index,
          }),
        )
      : null,
  };
}

/**
 * returns the formatted transactionOutput for ledger cardano app
 *
 * @param output
 * @param accountIndex
 * @returns {TxOutput}
 */
export function prepareLedgerOutput(output: TyphonTypes.Output, accountIndex: number): TxOutput {
  const isByronAddress = output.address instanceof TyphonAddress.ByronAddress;
  let isDeviceOwnedAddress = false;
  let destination: TxOutputDestination;

  if (!isByronAddress) {
    const address = output.address as TyphonTypes.ShelleyAddress;
    isDeviceOwnedAddress =
      address.paymentCredential &&
      address.paymentCredential.type === TyphonTypes.HashType.ADDRESS &&
      address.paymentCredential.bipPath !== undefined;
  }

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
      type: TxOutputDestinationType.DEVICE_OWNED,
      params: {
        type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
        params: {
          spendingPath: str_to_path(paymentKeyPathString),
          stakingPath: str_to_path(stakingKeyPathString),
        },
      },
    };
  } else {
    const address = output.address;
    destination = {
      type: TxOutputDestinationType.THIRD_PARTY,
      params: {
        addressHex: address.getHex(),
      },
    };
  }

  const tokenBundle: Array<AssetGroup> = Object.values(
    groupBy(output.tokens, ({ policyId }) => policyId),
  ).map(tokens => ({
    policyIdHex: tokens[0].policyId,
    tokens: tokens.map(token => ({
      assetNameHex: token.assetName,
      amount: token.amount.toString(),
    })),
  }));

  return {
    amount: output.amount.toString(),
    destination,
    tokenBundle,
  };
}

export function prepareStakeRegistrationCertificate(
  certificate: TyphonTypes.StakeRegistrationCertificate,
): {
  type: CertificateType.STAKE_REGISTRATION;
  params: StakeRegistrationParams;
} {
  if (
    certificate.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    certificate.stakeCredential.bipPath
  ) {
    return {
      type: CertificateType.STAKE_REGISTRATION,
      params: {
        stakeCredential: {
          type: StakeCredentialParamsType.KEY_PATH,
          keyPath: str_to_path(
            getBipPathString({
              account: certificate.stakeCredential.bipPath.account,
              chain: certificate.stakeCredential.bipPath.chain,
              index: certificate.stakeCredential.bipPath.index,
            }),
          ),
        },
      },
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}

export function prepareStakeDelegationCertificate(
  certificate: TyphonTypes.StakeDelegationCertificate,
): {
  type: CertificateType.STAKE_DELEGATION;
  params: StakeDelegationParams;
} {
  if (
    certificate.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    certificate.stakeCredential.bipPath
  ) {
    return {
      type: CertificateType.STAKE_DELEGATION,
      params: {
        stakeCredential: {
          type: StakeCredentialParamsType.KEY_PATH,
          keyPath: str_to_path(
            getBipPathString({
              account: certificate.stakeCredential.bipPath.account,
              chain: certificate.stakeCredential.bipPath.chain,
              index: certificate.stakeCredential.bipPath.index,
            }),
          ),
        },
        poolKeyHashHex: certificate.poolHash,
      },
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}

export function prepareStakeDeRegistrationCertificate(certificate: TyphonTypes.Certificate): {
  type: CertificateType.STAKE_DEREGISTRATION;
  params: StakeDeregistrationParams;
} {
  if (
    certificate.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    certificate.stakeCredential.bipPath
  ) {
    return {
      type: CertificateType.STAKE_DEREGISTRATION,
      params: {
        stakeCredential: {
          type: StakeCredentialParamsType.KEY_PATH,
          keyPath: str_to_path(
            getBipPathString({
              account: certificate.stakeCredential.bipPath.account,
              chain: certificate.stakeCredential.bipPath.chain,
              index: certificate.stakeCredential.bipPath.index,
            }),
          ),
        },
      },
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}

export function prepareWithdrawal(withdrawal: TyphonTypes.Withdrawal): Withdrawal {
  if (
    withdrawal.rewardAccount.stakeCredential.type === TyphonTypes.HashType.ADDRESS &&
    withdrawal.rewardAccount.stakeCredential.bipPath
  ) {
    return {
      stakeCredential: {
        type: StakeCredentialParamsType.KEY_PATH,
        keyPath: str_to_path(
          getBipPathString({
            account: withdrawal.rewardAccount.stakeCredential.bipPath.account,
            chain: withdrawal.rewardAccount.stakeCredential.bipPath.chain,
            index: withdrawal.rewardAccount.stakeCredential.bipPath.index,
          }),
        ),
      },
      amount: withdrawal.amount.toString(),
    };
  } else {
    throw new Error("Invalid stakeKey type");
  }
}
