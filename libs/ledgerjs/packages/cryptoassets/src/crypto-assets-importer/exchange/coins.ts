import fs from "fs";
import { fetchTokens } from "../fetch";

type CoinExchange = [string, string, string];

export const importCoinsExchange = async (outputDir: string) => {
  console.log("importing coins exchange...");
  try {
    const coinsExchange = await fetchTokens<CoinExchange>("exchange/coins.json");
    fs.writeFileSync(`${outputDir}/exchange/coins.json`, JSON.stringify(coinsExchange));

    const coinExchangeTypeStringified = `export type Exchange = [string, string, string];`;
    const exchangesStringified = `import exchanges from "./coins.json";`;
    const exportStringified = `export default exchanges as Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/coins.ts`,
      `${coinExchangeTypeStringified}

${exchangesStringified}

${exportStringified}
`,
    );
    console.log("importing coins exchange success");
  } catch (err) {
    console.error(err);
  }
};
