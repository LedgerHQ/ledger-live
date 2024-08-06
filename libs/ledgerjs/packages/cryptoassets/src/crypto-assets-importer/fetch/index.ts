import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import axios, { AxiosError } from "axios";

const CRYPTO_ASSETS_BASE_URL = "https://cdn.live.ledger.com/cryptoassets";
const CAL_SERVICE_BASE_URL = "https://crypto-assets-service.api.ledger.com";

export const fetchTokensFromCDN = async <T>(filename: string): Promise<[T, string | undefined]> => {
  try {
    const { data, headers } = await axios.get<T>(`${CRYPTO_ASSETS_BASE_URL}/${filename}`);
    return [data, headers.etag];
  } catch (err) {
    const error = err as AxiosError;
    throw new Error(`${error.message} ${CRYPTO_ASSETS_BASE_URL}/${filename}`);
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
  next?: { cursor: string; tokens: Pick<CALServiceOutput, T[number]>[] },
): Promise<[Pick<CALServiceOutput, T[number]>[], string | undefined]> => {
  try {
    const { data, headers } = await axios.get<Pick<CALServiceOutput, T[number]>[]>(
      `${CAL_SERVICE_BASE_URL}/v1/tokens`,
      {
        params: {
          ...(next?.cursor ? { cursor: next.cursor } : {}),
          chain_id: chainDetails.chainId,
          standard: chainDetails.standard,
          blockchain_name: chainDetails.blockchain_name,
          output: output.join(),
        },
      },
    );

    const cursor = headers["x-ledger-next"];
    if (cursor) {
      return fetchTokensFromCALService(
        { chainId: chainDetails.chainId, standard: chainDetails.standard },
        output,
        {
          tokens: next?.tokens ? [...next.tokens, ...data] : data,
          cursor,
        },
      );
    }

    const hash = headers["x-ledger-commit"];
    return next?.tokens ? [[...next.tokens, ...data], hash] : [data, hash];
  } catch (err) {
    const error = err as AxiosError;
    throw new Error(`${error.message} ${error.config?.url}`);
  }
};
