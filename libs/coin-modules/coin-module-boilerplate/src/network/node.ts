import network from "@ledgerhq/live-network/network";
import { type BoilerplateCoinConfig } from "../config";
import { SimulationError } from "../types/errors";
import { AccountInfoResponse, SubmitReponse } from "./types";

const getNodeUrl = (config: BoilerplateCoinConfig): string => config.infra.NODE_BOILERPLATE;

// txPayload needs to be unsigned
export const simulate = async (
  config: BoilerplateCoinConfig,
  serializedTx: string,
): Promise<number> => {
  const url = `${getNodeUrl(config)}/simulate`;
  const { data } = await network({
    url,
    method: "POST",
    data: {
      txPayload: serializedTx,
    },
  });
  if (data.error) {
    throw new SimulationError();
  }
  return data.fees;
};

// can be called nonce or sequence
export const getNextSequence = async (
  config: BoilerplateCoinConfig,
  address: string,
): Promise<number> => {
  const url = `${getNodeUrl(config)}/${address}/sequence`;
  try {
    const { data } = await network({
      url,
      method: "GET",
    });
    return data.sequence;
  } catch {
    return 0;
  }
};

export const getBlockHeight = async (config: BoilerplateCoinConfig): Promise<number> => {
  const url = `${getNodeUrl(config)}/blockheight`;
  const { data } = await network({
    url,
    method: "GET",
  });
  return data.blockHeight;
};

export const getLastBlock = async (
  config: BoilerplateCoinConfig,
): Promise<{
  blockHeight: number;
  blockHash: string;
  timestamp: number;
}> => {
  const url = `${getNodeUrl(config)}/block/current`;
  const { data } = await network({
    url,
    method: "GET",
  });
  return data;
};

export const submit = async (
  config: BoilerplateCoinConfig,
  signedTx: string,
): Promise<SubmitReponse> => {
  const url = `${getNodeUrl(config)}/submit`;
  const { data } = await network<SubmitReponse>({
    url,
    method: "GET",
    data: { signedTx },
  });
  return data;
};

export const getAccountInfo = async (
  config: BoilerplateCoinConfig,
  address: string,
): Promise<AccountInfoResponse> => {
  const {
    data: { result },
  } = await network<{ result: AccountInfoResponse }>({
    method: "POST",
    url: config.nodeUrl,
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
