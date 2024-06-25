import { DerivationType } from "@taquito/ledger-signer";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { DEFAULT_FEE, DEFAULT_STORAGE_LIMIT, Estimate } from "@taquito/taquito";
import { b58cencode, Prefix, prefix } from "@taquito/utils";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { getTezosToolkit } from "../network/tezosToolkit";
import { TezosOperationMode } from "../types/model";

export type CoreAccountInfo = {
  xpub?: string;
  address: string;
  balance: BigNumber;
  revealed: boolean;
};
export type CoreTransactionInfo = {
  mode: TezosOperationMode;
  recipient: string;
  amount: number;
  useAllAmount?: boolean;
};

export type EstimatedFees = {
  fees: BigNumber;
  gasLimit: BigNumber;
  storageLimit: BigNumber;
  estimatedFees: BigNumber;
  amount?: BigNumber;
  taquitoError?: string;
};
/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} account
 * @param {Transaction} transaction
 */
export async function estimateFees({
  account,
  transaction,
}: {
  account: CoreAccountInfo;
  transaction: CoreTransactionInfo;
}): Promise<EstimatedFees> {
  const encodedPubKey = b58cencode(
    compressPublicKey(Buffer.from(account.xpub || "", "hex"), DerivationType.ED25519),
    prefix[Prefix.EDPK],
  );

  const tezosToolkit = getTezosToolkit();
  tezosToolkit.setProvider({
    signer: {
      publicKeyHash: async () => account.address,
      publicKey: async () => encodedPubKey,
      sign: () => Promise.reject(new Error("unsupported")),
      secretKey: () => Promise.reject(new Error("unsupported")),
    },
  });

  let amount = transaction.amount;
  if (transaction.useAllAmount) {
    amount = 1; // send max do a pre-estimation with minimum amount (taquito refuses 0)
  }

  const estimation: EstimatedFees = {
    fees: new BigNumber(0),
    gasLimit: new BigNumber(0),
    storageLimit: new BigNumber(0),
    estimatedFees: new BigNumber(0),
  };

  try {
    let estimate: Estimate;
    switch (transaction.mode) {
      case "send":
        estimate = await tezosToolkit.estimate.transfer({
          mutez: true,
          to: transaction.recipient,
          amount,
          storageLimit: DEFAULT_STORAGE_LIMIT.ORIGINATION, // https://github.com/TezTech/eztz/blob/master/PROTO_003_FEES.md for originating an account
        });
        break;
      case "delegate":
        estimate = await tezosToolkit.estimate.setDelegate({
          source: account.address,
          delegate: transaction.recipient,
        });
        break;
      case "undelegate":
        estimate = await tezosToolkit.estimate.setDelegate({
          source: account.address,
        });
        break;
      default:
        throw new Error("unsupported mode=" + transaction.mode);
    }

    if (transaction.useAllAmount) {
      const totalFees = estimate.suggestedFeeMutez + estimate.burnFeeMutez;
      const maxAmount = account.balance
        .minus(totalFees + (account.revealed ? 0 : DEFAULT_FEE.REVEAL))
        .toNumber();
      // from https://github.com/ecadlabs/taquito/blob/a70c64c4b105381bb9f1d04c9c70e8ef26e9241c/integration-tests/contract-empty-implicit-account-into-new-implicit-account.spec.ts#L33
      // Temporary fix, see https://gitlab.com/tezos/tezos/-/issues/1754
      // we need to increase the gasLimit and fee returned by the estimation
      const gasBuffer = 500;
      const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
      const increasedFee = (gasBuffer: number, opSize: number) => {
        return gasBuffer * MINIMAL_FEE_PER_GAS_MUTEZ + opSize;
      };
      const incr = increasedFee(gasBuffer, Number(estimate.opSize));

      estimation.fees = new BigNumber(estimate.suggestedFeeMutez + incr);
      estimation.gasLimit = new BigNumber(estimate.gasLimit + gasBuffer);
      estimation.amount = maxAmount - incr > 0 ? new BigNumber(maxAmount - incr) : new BigNumber(0);
    } else {
      estimation.fees = new BigNumber(estimate.suggestedFeeMutez);
      estimation.gasLimit = new BigNumber(estimate.gasLimit);
    }

    estimation.storageLimit = new BigNumber(estimate.storageLimit);
    estimation.estimatedFees = estimation.fees;
    if (!account.revealed) {
      estimation.estimatedFees = estimation.estimatedFees.plus(DEFAULT_FEE.REVEAL);
    }
  } catch (e) {
    if (typeof e !== "object" || !e) throw e;
    if ("id" in e) {
      estimation.taquitoError = (e as { id: string }).id;
      log("taquito-error", "taquito got error " + e.id);
    } else if ("status" in e) {
      // in case of http 400, log & ignore (more case to handle)
      log("taquito-network-error", String((e as unknown as { message: string }).message || ""), {
        transaction: transaction,
      });
      throw e;
    } else {
      throw e;
    }
  }

  return estimation;
}
