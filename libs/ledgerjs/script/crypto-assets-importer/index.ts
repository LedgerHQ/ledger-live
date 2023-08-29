import axios, { AxiosError } from "axios";
import { log } from "console";
import path from "path";

import { importEIP712 } from "./evm/eip712";

log("Starting importing cryptoassets from CDN...");

const CRYPTO_ASSETS_BASE_URL = "https://cdn.live.ledger.com/cryptoassets";
const COUNTER_VALUES_BASE_URL = "https://countervalues.live.ledger.com/v2";
const outputFolder = path.join(__dirname, "../../packages/cryptoassets/src/data");

const getTickers = async (): Promise<string[]> => {
  try {
    const { data } = await axios.get<string[]>(`${COUNTER_VALUES_BASE_URL}/tickers`);
    return data;
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
    return [];
  }
};

const importTokens = async () => {
  await importEIP712(CRYPTO_ASSETS_BASE_URL, outputFolder);
};

const main = async () => {
  const tickers = await getTickers();
  await importTokens();
};

main();
