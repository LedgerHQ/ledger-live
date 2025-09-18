import { DerivationType } from "@taquito/ledger-signer";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { COST_PER_BYTE, getRevealFee, ORIGINATION_SIZE, Estimate } from "@taquito/taquito";
import { b58Encode, PrefixV2 } from "@taquito/utils";
import { log } from "@ledgerhq/logs";
import { getTezosToolkit } from "./tezosToolkit";
import { TezosOperationMode } from "../types/model";
import { UnsupportedTransactionMode } from "../types/errors";

export type CoreAccountInfo = {
  address: string;
  balance: bigint;
  revealed: boolean;
  xpub?: string;
};
export type CoreTransactionInfo = {
  mode: TezosOperationMode;
  recipient: string;
  amount: bigint;
  useAllAmount?: boolean;
};

export type EstimatedFees = {
  fees: bigint;
  gasLimit: bigint;
  storageLimit: bigint;
  estimatedFees: bigint;
  amount?: bigint;
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
  let derivationType: DerivationType;
  let prefix: PrefixV2;
  if (account.address?.startsWith("tz1")) {
    derivationType = DerivationType.ED25519;
    prefix = PrefixV2.Ed25519PublicKey;
  } else if (account.address?.startsWith("tz2")) {
    derivationType = DerivationType.SECP256K1;
    prefix = PrefixV2.Secp256k1PublicKey;
  } else if (account.address?.startsWith("tz3")) {
    derivationType = DerivationType.P256;
    prefix = PrefixV2.P256PublicKey;
  } else {
    throw Error(`Failed detecting key derivation type from address ${account.address}`);
  }

  const encodedPubKey = b58Encode(
    compressPublicKey(Buffer.from(account.xpub || "", "hex"), derivationType),
    prefix,
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

  const estimation: EstimatedFees = {
    fees: BigInt(0),
    gasLimit: BigInt(0),
    storageLimit: BigInt(0),
    estimatedFees: BigInt(0),
  };

  // For legacy compatibility
  if (account.balance === BigInt(0)) {
    return transaction.useAllAmount ? { ...estimation, amount: BigInt(0) } : estimation;
  }

  let amount = transaction.amount;
  if (transaction.useAllAmount) {
    amount = BigInt(1); // send max do a pre-estimation with minimum amount (taquito refuses 0)
  }

  try {
    let estimate: Estimate;
    switch (transaction.mode) {
      case "send":
        estimate = await tezosToolkit.estimate.transfer({
          mutez: true,
          to: transaction.recipient,
          amount: Number(amount),
          storageLimit: ORIGINATION_SIZE, // https://github.com/TezTech/eztz/blob/master/PROTO_003_FEES.md for originating an account
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
        throw new UnsupportedTransactionMode("unsupported mode", { mode: transaction.mode });
    }

    // NOTE: if useAllAmount is true, is it for sure in the send mode (ie. transfer)?
    if (transaction.useAllAmount) {
      let totalFees: number;
      if (estimate.burnFeeMutez > 0) {
        // NOTE: from https://github.com/ecadlabs/taquito/blob/master/integration-tests/__tests__/contract/empty-implicit-account-into-new-implicit-account.spec.ts#L37
        totalFees = estimate.suggestedFeeMutez + estimate.burnFeeMutez - 20 * COST_PER_BYTE; // 20 is storage buffer
      } else {
        totalFees = estimate.suggestedFeeMutez;
      }
      const maxAmount =
        parseInt(account.balance.toString()) -
        (totalFees + (account.revealed ? 0 : getRevealFee(account.address)));
      // NOTE: from https://github.com/ecadlabs/taquito/blob/a70c64c4b105381bb9f1d04c9c70e8ef26e9241c/integration-tests/contract-empty-implicit-account-into-new-implicit-account.spec.ts#L33
      // Temporary fix, see https://gitlab.com/tezos/tezos/-/issues/1754
      // we need to increase the gasLimit and fee returned by the estimation
      const gasBuffer = 500;
      const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
      const increasedFee = (gasBuffer: number, opSize: number) => {
        return gasBuffer * MINIMAL_FEE_PER_GAS_MUTEZ + opSize;
      };
      const incr = increasedFee(gasBuffer, Number(estimate.opSize));

      const maxMinusBuff = maxAmount - (gasBuffer - incr);
      estimation.amount = maxMinusBuff > 0 ? BigInt(maxMinusBuff) : BigInt(0);

      estimation.fees = BigInt(estimate.suggestedFeeMutez);
      estimation.gasLimit = BigInt(estimate.gasLimit);
    } else {
      estimation.fees = BigInt(estimate.suggestedFeeMutez);
      estimation.gasLimit = BigInt(estimate.gasLimit);
      estimation.amount = transaction.amount;
    }
    estimation.storageLimit = BigInt(estimate.storageLimit);
    estimation.estimatedFees = estimation.fees;
    if (!account.revealed) {
      estimation.estimatedFees = estimation.estimatedFees + BigInt(getRevealFee(account.address));
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
