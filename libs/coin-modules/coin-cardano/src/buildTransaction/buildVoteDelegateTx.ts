import BigNumber from "bignumber.js";
import { Transaction as TyphonTransaction, types as TyphonTypes } from "@stricahq/typhonjs";

import { CardanoAccount, CardanoResources, Transaction } from "../types";
import { getAccountStakeCredential, getTyphonInputFromUtxo, selectMinimumUtxos } from "../logic";

function getDRepFromHex(dRepHex: string): TyphonTypes.DRep {
  const header = dRepHex.slice(0, 2);
  const key = dRepHex.slice(2);

  /**
   * dRepHex header bits format defined in CIP-129 (https://cips.cardano.org/cip/CIP-0129)
   * 22 -> DRep Address
   * 23 -> DRep Script
   */
  if (header === "22") {
    return {
      type: TyphonTypes.DRepType.ADDRESS,
      key: Buffer.from(key, "hex"),
    };
  }

  if (header === "23") {
    return {
      type: TyphonTypes.DRepType.SCRIPT,
      key: Buffer.from(key, "hex"),
    };
  }

  throw new Error("Invalid dRepHex");
}

export const buildVoteDelegationTransaction = async ({
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
  const protocolParams = transaction.protocolParams;

  // protocolParams will always be present
  if (!protocolParams) throw new Error("Missing protocol parameters");

  const cardanoResources = account.cardanoResources as CardanoResources;

  const stakeCredential = getAccountStakeCredential(account.xpub as string, account.index);
  const stakeKeyHashCredential: TyphonTypes.HashCredential = {
    hash: Buffer.from(stakeCredential.key, "hex"),
    type: TyphonTypes.HashType.ADDRESS,
    bipPath: stakeCredential.path,
  };

  /**
   * stake registration is required before delegating to a DRep
   * if the account is not already registered, add a stake registration certificate
   */
  if (!cardanoResources.delegation || !cardanoResources.delegation.status) {
    const stakeRegistrationCert: TyphonTypes.StakeKeyRegistrationCertificate = {
      type: TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
      cert: {
        stakeCredential: stakeKeyHashCredential,
        deposit: new BigNumber(protocolParams.stakeKeyDeposit),
      },
    };
    typhonTx.addCertificate(stakeRegistrationCert);
  }

  // add vote delegation certificate
  let voteDelegationCert: TyphonTypes.VoteDelegationCertificate;
  if (transaction.dRepAbstain) {
    voteDelegationCert = {
      type: TyphonTypes.CertificateType.VOTE_DELEGATION,
      cert: {
        stakeCredential: stakeKeyHashCredential,
        dRep: {
          type: TyphonTypes.DRepType.ABSTAIN,
          key: undefined,
        },
      },
    };
  } else if (transaction.dRepNoConfidence) {
    voteDelegationCert = {
      type: TyphonTypes.CertificateType.VOTE_DELEGATION,
      cert: {
        stakeCredential: stakeKeyHashCredential,
        dRep: { type: TyphonTypes.DRepType.NO_CONFIDENCE, key: undefined },
      },
    };
  } else if (transaction.dRepHex) {
    voteDelegationCert = {
      type: TyphonTypes.CertificateType.VOTE_DELEGATION,
      cert: {
        stakeCredential: stakeKeyHashCredential,
        dRep: getDRepFromHex(transaction.dRepHex),
      },
    };
  } else {
    throw new Error("Invalid Vote");
  }
  typhonTx.addCertificate(voteDelegationCert);

  // select utxos and set transaction inputs
  const selectedUtxos = selectMinimumUtxos(cardanoResources.utxos, new BigNumber(0));
  const transactionInputs = selectedUtxos.map(getTyphonInputFromUtxo);

  return typhonTx.prepareTransaction({
    inputs: transactionInputs,
    changeAddress,
  });
};
