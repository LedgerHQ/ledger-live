import type { Api } from "@ledgerhq/coin-framework/api/index";
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

async function craft(
  address: string,
  transaction: {
    recipient: string;
    amount: bigint;
    fee: bigint;
  },
): Promise<string> {
  const { contents } = await craftTransaction(
    { address },
    { ...transaction, type: "send", fee: { fees: transaction.fee.toString() } },
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
