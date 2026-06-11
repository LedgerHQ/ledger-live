import { type OperationContents, OpKind } from "@taquito/rpc";
import coinConfig from "../config";
import { UnsupportedTransactionMode } from "../types/errors";
import { createMockSigner } from "../utils";
import { estimateRevealLimits } from "./estimateRevealLimits";
import { getTezosToolkit } from "./tezosToolkit";

export type TransactionFee = {
  fees?: string;
  gasLimit?: string;
  storageLimit?: string;
};
export type TransactionType =
  | "OUT"
  | "DELEGATE"
  | "UNDELEGATE"
  | "STAKE"
  | "UNSTAKE"
  | "FINALIZE_UNSTAKE";

export async function craftTransaction(
  account: {
    address: string;
    counter?: number;
  },
  transaction: {
    type:
      | "send"
      | "delegate"
      | "undelegate"
      | "send_token"
      | "stake"
      | "unstake"
      | "finalize_unstake";
    recipient: string;
    amount: bigint;
    fee: TransactionFee;
    contractAddress?: string;
    tokenId?: number;
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
    const reveal = await estimateRevealLimits(tezosToolkit, address, feesConfig);

    contents.push({
      kind: OpKind.REVEAL,
      fee: reveal.fee.toString(),
      gas_limit: reveal.gasLimit.toString(),
      storage_limit: reveal.storageLimit.toString(),
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
    case "send_token": {
      if (!transaction.contractAddress || transaction.tokenId === undefined) {
        throw new Error("FA2 transfer requires contractAddress and tokenId");
      }
      type = "OUT";
      const tokenContract = await tezosToolkit.contract.at(transaction.contractAddress);
      const transferParams = tokenContract.methods
        .transfer([
          {
            from_: address,
            txs: [
              {
                to_: transaction.recipient,
                token_id: transaction.tokenId,
                amount: transaction.amount,
              },
            ],
          },
        ])
        .toTransferParams({ mutez: true });
      contents.push({
        kind: OpKind.TRANSACTION,
        source: address,
        destination: transaction.contractAddress,
        amount: "0",
        counter: (counter + 1 + contents.length).toString(),
        parameters: transferParams.parameter,
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
    case "stake":
    case "unstake":
    case "finalize_unstake": {
      const typeMap = {
        stake: "STAKE",
        unstake: "UNSTAKE",
        finalize_unstake: "FINALIZE_UNSTAKE",
      } as const;
      type = typeMap[transaction.type];
      contents.push({
        kind: OpKind.TRANSACTION,
        amount: transaction.type === "finalize_unstake" ? "0" : transaction.amount.toString(),
        destination: address,
        source: address,
        counter: (counter + 1 + contents.length).toString(),
        parameters: { entrypoint: transaction.type, value: { prim: "Unit" } },
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
