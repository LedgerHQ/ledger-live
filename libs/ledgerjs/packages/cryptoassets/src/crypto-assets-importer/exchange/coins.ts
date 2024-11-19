import fs from "fs";
import { fetchTokensFromCDN } from "../fetch";

type CoinExchange = [string, string, string];

export const importCoinsExchange = async (outputDir: string) => {
  console.log("importing coins exchange...");
  try {
    const [coinsExchange, hash] = await fetchTokensFromCDN<CoinExchange>("exchange/coins.json");
    fs.writeFileSync(`${outputDir}/exchange/coins.json`, JSON.stringify(coinsExchange));
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/coin-hash.json`, JSON.stringify(hash));
    }

    const coinExchangeTypeStringified = `export type Exchange = [string, string, string];`;
    const hashStringified = hash ? `export { default as hash } from "./coin-hash.json";` : "";
    const exchangesStringified = `import exchanges from "./coins.json";`;
    const exportStringified = `export default exchanges as Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/coins.ts`,
      `${coinExchangeTypeStringified}

${hashStringified}

${exchangesStringified}

${exportStringified}
`,
    );
    console.log("importing coins exchange success");
  } catch (err) {
    console.error(err);
  }
};
