import { log } from "@ledgerhq/logs";
import { type OperationContents, OpKind } from "@taquito/rpc";
import { getRevealFee, getRevealGasLimit } from "@taquito/taquito";
import coinConfig from "../config";
import { UnsupportedTransactionMode } from "../types/errors";
import { createMockSigner } from "../utils";
import { getTezosToolkit } from "./tezosToolkit";

export type TransactionFee = {
  fees?: string;
  gasLimit?: string;
  storageLimit?: string;
};
export type TransactionType = "OUT" | "DELEGATE" | "UNDELEGATE";

export async function craftTransaction(
  account: {
    address: string;
    counter?: number;
  },
  transaction: {
    type: "send" | "delegate" | "undelegate";
    recipient: string;
    amount: bigint;
    fee: TransactionFee;
  },
  publicKey?: {
    publicKey: string;
    publicKeyHash: string;
  },
): Promise<{ type: TransactionType; contents: OperationContents[] }> {
  const { address } = account;

  const transactionFees = {
    fee: transaction.fee.fees ?? "0",
    gas_limit: transaction.fee.gasLimit ?? "0",
    storage_limit: transaction.fee.storageLimit ?? "0",
  };

  const tezosToolkit = getTezosToolkit();

  // Configure signer for Taquito operations (same as in estimateFees)
  if (publicKey) {
    tezosToolkit.setProvider({
      signer: createMockSigner(publicKey.publicKeyHash, publicKey.publicKey),
    });
  }

  const sourceData = await tezosToolkit.rpc.getContract(address);
  const counter = account.counter ?? Number(sourceData.counter);

  const contents: OperationContents[] = [];

  if (publicKey !== undefined) {
    const feesConfig = coinConfig.getCoinConfig().fees;

    type RevealEstimate = { gasLimit?: number; storageLimit?: number; suggestedFeeMutez?: number };
    let revealEstimate: RevealEstimate | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      revealEstimate = (await tezosToolkit.estimate.reveal()) as RevealEstimate;
    } catch (error) {
      // for some unknown reason, on some addresses the estimation fails with "inconsistent_hash" error, we fall back to
      // another method from the SDK
      log("estimate-error", "error estimating reveal fees, trying using getRevealGasLimit", {
        error,
      });
      revealEstimate = {
        gasLimit: getRevealGasLimit(address),
        suggestedFeeMutez: getRevealFee(address),
      };
    }

    const revealFee = Math.max(
      feesConfig.minFees ?? 0,
      revealEstimate?.suggestedFeeMutez ?? getRevealFee(address) ?? 0,
    );
    const revealGasLimit = Math.max(
      feesConfig.minRevealGasLimit ?? 0,
      revealEstimate?.gasLimit ?? 0,
    );
    const revealStorageLimit = Math.max(
      feesConfig.minStorageLimit ?? 0,
      revealEstimate?.storageLimit ?? 0,
    );

    contents.push({
      kind: OpKind.REVEAL,
      fee: revealFee.toString(),
      gas_limit: revealGasLimit.toString(),
      storage_limit: revealStorageLimit.toString(),
      source: publicKey.publicKeyHash,
      counter: (counter + 1 + contents.length).toString(),
      public_key: publicKey.publicKey,
    });
  }

  let type: TransactionType;
  switch (transaction.type) {
    case "send": {
      type = "OUT";
      contents.push({
        kind: OpKind.TRANSACTION,
        amount: transaction.amount.toString(),
        destination: transaction.recipient,
        source: address,
        counter: (counter + 1 + contents.length).toString(),
        ...transactionFees,
      });
      break;
    }
    case "delegate": {
      type = "DELEGATE";
      contents.push({
        kind: OpKind.DELEGATION,
        source: address,
        counter: (counter + 1 + contents.length).toString(),
        delegate: transaction.recipient,
        ...transactionFees,
      });
      break;
    }
    case "undelegate": {
      // we undelegate as there's no "delegate" field
      // OpKind is still "DELEGATION"
      type = "UNDELEGATE";
      contents.push({
        kind: OpKind.DELEGATION,
        source: address,
        counter: (counter + 1).toString(),
        ...transactionFees,
      });
      break;
    }
    default:
      throw new UnsupportedTransactionMode("unsupported mode", { mode: transaction.type });
  }

  return { type, contents };
}

/**
 * Return transaction in raw encoded format (i.e. hexa)
 */
export async function rawEncode(contents: OperationContents[]): Promise<string> {
  const tezosToolkit = getTezosToolkit();

  const block = await tezosToolkit.rpc.getBlock();
  const forgedBytes = await tezosToolkit.rpc.forgeOperations({
    branch: block.hash,
    contents,
  });

  // 0x03 is a conventional prefix (aka a watermark) for tezos transactions
  return Buffer.concat([Buffer.from("03", "hex"), Buffer.from(forgedBytes, "hex")]).toString("hex");
}
