import { ethers } from "ethers";
import ERC20ABI from "../abis/erc20.abi.json";

export function getErc20Data(recipient: string, amount: bigint): Buffer {
  const contract = new ethers.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return Buffer.from(data.slice(2), "hex");
}

export function getErc20ApproveData(spender: string, amount: bigint): Buffer {
  const contract = new ethers.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("approve", [spender, amount]);
  return Buffer.from(data.slice(2), "hex");
}
