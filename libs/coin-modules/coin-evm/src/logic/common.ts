import { ethers } from "ethers";
import { TransactionTypes } from "ethers/lib/utils";
import ERC20ABI from "../abis/erc20.abi.json";

export function getTransactionType(intentType: string): TransactionTypes {
  if (!["send-legacy", "send-eip1559"].includes(intentType)) {
    throw new Error(
      `Unsupported intent type '${intentType}'. Must be 'send-legacy' or 'send-eip1559'`,
    );
  }

  return intentType === "send-legacy" ? TransactionTypes.legacy : TransactionTypes.eip1559;
}

export function getErc20Data(recipient: string, amount: bigint): Buffer {
  const contract = new ethers.utils.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return Buffer.from(data.slice(2), "hex");
}
