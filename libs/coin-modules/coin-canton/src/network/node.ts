import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import type { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import crypto from "crypto";
import coinConfig from "../config";
import { SimulationError } from "../types/errors";
import { AccountInfoResponse, SubmitResponse } from "./types";

const getNodeUrl = () => coinConfig.getCoinConfig().nodeUrl || "";
const getNetworkType = () => coinConfig.getCoinConfig().networkType;

// JWT generation for localnet
export const generateJWT = () => {
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/[+/=]/g, c => ({ "+": "-", "/": "_", "=": "" })[c] || "");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: "ledger-api-user",
    aud: "https://canton.network.global",
    iss: "unsafe-issuer",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  });
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", "unsafe")
    .update(data)
    .digest("base64")
    .replace(/[+/=]/g, c => ({ "+": "-", "/": "_", "=": "" })[c] || "");
  return `${data}.${signature}`;
};

const networkW = <T>(req: LiveNetworkRequest<T>) => {
  const envJwt = process.env[getNetworkType().toUpperCase() + "_JWT"];
  const bearerJwt = envJwt !== undefined ? envJwt : generateJWT();
  return network<T>({
    ...req,
    headers: {
      ...(req.headers || {}),
      Authorization: `Bearer ${bearerJwt}`,
    },
  });
};

// txPayload needs to be unsigned
export const simulate = async (serializedTx: string): Promise<number> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/simulate`;
  const { data } = await network<{ error: string; fees: number }>({
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

export const getLedgerEnd = async (): Promise<number> => {
  const url = `${getNodeUrl()}/state/ledger-end`;
  const { data } = await networkW<{ offset: number }>({
    url,
    method: "GET",
  });

  return data.offset;
};

export const submit = async (signedTx: string): Promise<SubmitResponse> => {
  // @ts-expect-error: add NODE_BOILERPLATE to libs/env/src/env.ts
  const url = `${getEnv("NODE_BOILERPLATE")}/submit`;
  const { data } = await network<SubmitResponse>({
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
