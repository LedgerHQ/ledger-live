import network from "@ledgerhq/live-network";
import { getEnv } from "@ledgerhq/live-env";
import { SimulationError } from "../types/errors";
import coinConfig from "../config";
import { AccountInfoResponse, SubmitReponse } from "./types";

const getNodeUrl = (): string => coinConfig.getCoinConfig().nodeUrl;

// NOTE: add NODE_BOILERPLATE to libs/env/src/env.ts

// txPayload needs to be unsigned
export const simulate = async (serializedTx: string): Promise<number> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/simulate`;
  const { data } = await network<{ error: string } | { fees: number }>({
    url,
    method: "POST",
    data: {
      txPayload: serializedTx,
    },
  });
  if ("error" in data) {
    throw new SimulationError();
  }
  return data.fees;
};

// can be called nonce or sequence
export const getNextSequence = async (address: string): Promise<number> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/${address}/sequence`;
  try {
    const { data } = await network<{ sequence: number }>({
      url,
      method: "GET",
    });
    return data.sequence;
  } catch (e) {
    return 0;
  }
};

export const getBlockHeight = async (): Promise<number> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/blockheight`;
  const { data } = await network<{ blockHeight: number }>({
    url,
    method: "GET",
  });
  return data.blockHeight;
};

export const getLastBlock = async (): Promise<{
  blockHeight: number;
  blockHash: string;
  timestamp: number;
}> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/block/current`;
  const { data } = await network<{
    blockHeight: number;
    blockHash: string;
    timestamp: number;
  }>({
    url,
    method: "GET",
  });
  return data;
};

export const submit = async (_signedTx: string): Promise<SubmitReponse> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/submit`;
  const { data } = await network<SubmitReponse>({
    url,
    method: "GET",
  });
  return data;
};

export const getAccountInfo = async (address: string): Promise<AccountInfoResponse> => {
  const {
    data: { result },
  } = await network<{ result: AccountInfoResponse }>({
    method: "POST",
    url: getNodeUrl(),
    data: {
      method: "account_info",
      params: [
        {
          account: address,
        },
      ],
    },
  });

  return result;
};
