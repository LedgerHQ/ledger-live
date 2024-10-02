import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import axios, { AxiosError } from "axios";

const LEDGER_COUNTERVALUES_API = getEnv("LEDGER_COUNTERVALUES_API");

export const fetchTokensFromCDN = async <T>(filename: string): Promise<[T, string | undefined]> => {
  try {
    const { data, headers } = await axios.get<T>(`${getEnv("DYNAMIC_CAL_BASE_URL")}/${filename}`);
    return [data, headers.etag];
  } catch (err) {
    const error = err as AxiosError;
    throw new Error(`${error.message} ${getEnv("DYNAMIC_CAL_BASE_URL")}/${filename}`);
  }
};

export type CALServiceOutput = {
  type: string;
  id: string;
  blockchain_name: string;
  chain_id: number;
  contract_address: string;
  token_identifier: string;
  decimals: number;
  delisted: boolean;
  network_type: string;
  name: string;
  symbol: string;
  ticker: string;
  units: string;
  live_signature: string;
  exchange_app_config_serialized: string;
  exchange_app_signature: string;
};

export const fetchTokensFromCALService = async <T extends Array<keyof CALServiceOutput>>(
  chainDetails: {
    chainId?: string | number;
    standard?: string;
    blockchain_name?: CryptoCurrencyId;
  },
  output: T,
  etag?: string | null,
  next?: { cursor: string; tokens: Pick<CALServiceOutput, T[number]>[] },
): Promise<{ tokens: Pick<CALServiceOutput, T[number]>[]; hash: string | undefined }> => {
  try {
    const { data, headers } = await axios.get<Pick<CALServiceOutput, T[number]>[]>(
      `${getEnv("CAL_SERVICE_URL")}/v1/tokens`,
      {
        params: {
          ...(next?.cursor ? { cursor: next.cursor } : {}),
          chain_id: chainDetails.chainId,
          standard: chainDetails.standard,
          blockchain_name: chainDetails.blockchain_name,
          output: output.join(),
        },
        headers: etag
          ? {
              "If-None-Match": etag,
            }
          : undefined,
      },
    );

    const cursor = headers["x-ledger-next"];
    if (cursor) {
      return fetchTokensFromCALService(
        { chainId: chainDetails.chainId, standard: chainDetails.standard },
        output,
        etag,
        {
          tokens: next?.tokens ? [...next.tokens, ...data] : data,
          cursor,
        },
      );
    }

    const hash = headers["etag"];
    return next?.tokens ? { tokens: [...next.tokens, ...data], hash } : { tokens: data, hash };
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response?.status === 304) {
        throw err;
      }
      throw new Error(`${err?.message}: ${err?.config?.url}`);
    }
    throw err;
  }
};

export const fetchTokensOrderedByMarketCap = async (): Promise<{
  tokens: string[];
}> => {
  const { data } = await axios.get<string[]>(`${LEDGER_COUNTERVALUES_API}/v3/supported/crypto`);
  return { tokens: data };
};
