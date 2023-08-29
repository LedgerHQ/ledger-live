import axios, { AxiosError } from "axios";
import { log } from "console";
import fs from "fs";

type CoinExchange = [string, string, string];

const fetchCoinsExchange = async (baseURL: string): Promise<CoinExchange[]> => {
  try {
    const { data } = await axios.get<CoinExchange[]>(`${baseURL}/exchange/coins.json`);
    return data;
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
    return [];
  }
};

export const importCoinsExchange = async (baseURL: string, outputDir: string) => {
  log("importing coins exchange...");
  const coinsExchange = await fetchCoinsExchange(baseURL);
  fs.writeFileSync(`${outputDir}/exchange/coins.json`, JSON.stringify(coinsExchange));

  const coinExchangeTypeStringified = `export type Exchange = [string, string, string];`;
  const exchangesStringified = `const exchanges: Exchange[] = ${JSON.stringify(
    coinsExchange,
    null,
    2,
  )};`;
  const exportStringified = `export default exchanges;`;

  fs.writeFileSync(
    `${outputDir}/exchange/coins.ts`,
    `${coinExchangeTypeStringified}

${exchangesStringified}

${exportStringified}
  `,
  );
  log("importing coins exchange success");
};
