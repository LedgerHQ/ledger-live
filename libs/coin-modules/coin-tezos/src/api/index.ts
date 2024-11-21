import {
  IncorrectTypeError,
  type Api,
  type Transaction as ApiTransaction,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
  rawEncode,
} from "../logic";
import api from "../network/tzkt";

export function createApi(config: TezosConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations,
  };
}

function isTezosTransactionType(type: string): type is "send" | "delegate" | "undelegate" {
  return ["send", "delegate", "undelegate"].includes(type);
}
async function craft(
  address: string,
  { type, recipient, amount, fee }: ApiTransaction,
): Promise<string> {
  if (!isTezosTransactionType(type)) {
    throw new IncorrectTypeError(type);
  }

  const { contents } = await craftTransaction(
    { address },
    { recipient, amount, type, fee: { fees: fee.toString() } },
  );
  return rawEncode(contents);
}

async function estimate(addr: string, amount: bigint): Promise<bigint> {
  const accountInfo = await api.getAccountByAddress(addr);
  if (accountInfo.type !== "user") throw new Error("unexpected account type");

  const estimatedFees = await estimateFees({
    account: {
      address: addr,
      revealed: accountInfo.revealed,
      balance: BigInt(accountInfo.balance),
      xpub: accountInfo.publicKey,
    },
    transaction: { mode: "send", recipient: addr, amount: amount },
  });
  return estimatedFees.estimatedFees;
}
