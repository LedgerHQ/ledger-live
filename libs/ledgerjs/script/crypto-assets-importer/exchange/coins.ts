import { log } from "console";
import fs from "fs";
import { fetchTokens } from "../fetch";

type CoinExchange = [string, string, string];

export const importCoinsExchange = async (outputDir: string) => {
  log("importing coins exchange...");
  try {
    const coinsExchange = await fetchTokens<CoinExchange>("exchange/coins.json");
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
  } catch (err) {
    console.error(err);
  }
};
