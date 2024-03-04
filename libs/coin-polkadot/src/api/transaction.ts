// Dummy file to test Lama interface

import BigNumber from "bignumber.js";
import { broadcast } from "../logic";
import { craftTransaction } from "../logic/buildTransaction";
import { fakeSignExtrinsic } from "../logic/signTransaction";

type EstimateFeesResponse = {
  total_fee: number;
};
//TODO
export async function estimateTransactionFees(
  _params: CraftTransactionParams,
): Promise<EstimateFeesResponse> {
  // getEstimationFees
  return Promise.resolve({
    total_fee: 0,
  });
}

type CraftTransactionParams = {
  type: "send";
  account: {
    network: "polkadot";
    id: string; //"16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV"
  };
  intent: {
    to: string; //"157n4fS8ZFYYH7T9HdN9Nmyrycq3td7uM76yodDBZ3cr5U18",
    amount: number; //500000
  };
};
type CraftTransactionResponse = {
  raw_transaction: string;
};
export async function craftUnsignedTransaction(
  params: CraftTransactionParams,
): Promise<CraftTransactionResponse> {
  const nonce = 0; //FIXME
  const { unsigned, registry } = await craftTransaction(params.account.id, nonce, {
    mode: "send",
    amount: new BigNumber(params.intent.amount),
    recipient: params.intent.to,
    isFirstBond: false,
  });

  const encodeTx = await fakeSignExtrinsic(unsigned, registry);

  return {
    raw_transaction: encodeTx,
  };
}

type CombineSignatureParams = {
  raw_transaction: "string";
  signatures: Array<{
    pub_key: string;
    signature: string;
  }>;
};
type CombineSignatureResponse = {
  raw: string;
  hash: string;
};
//TODO?
export async function combineSignation(
  _params: CombineSignatureParams,
): Promise<CombineSignatureResponse> {
  return Promise.resolve({
    raw: "",
    hash: "",
  });
}

type BroadcastParams = {
  raw_transaction: string;
  account: {
    network: "polkadot";
    id: string; //"16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV"
  };
};
type BroadcastResponse = {
  transaction_identifier: string;
};
export async function broadcastTransaction(params: BroadcastParams): Promise<BroadcastResponse> {
  const hash = await broadcast(params.raw_transaction);
  return {
    transaction_identifier: hash,
  };
}
