import axios, { AxiosError } from "axios";

const CRYPTO_ASSETS_BASE_URL =
  "https://cdn.live.ledger-stg.com/cryptoassets/branches/BACK-6180-ethereum-app-for-all-evms/cryptoassets";

export const fetchTokens = async <T>(filename: string): Promise<T> => {
  try {
    const { data } = await axios.get<T>(`${CRYPTO_ASSETS_BASE_URL}/${filename}`);
    return data;
  } catch (err) {
    const error = err as AxiosError;
    throw new Error(`${error.message} ${CRYPTO_ASSETS_BASE_URL}/${filename}`);
  }
};
