import fs from "fs";
import { fetchTokens } from "../fetch";

type ERC20POLYGONExchange = [string, string, string];

export const importERC20POLYGONExchange = async (outputDir: string) => {
  console.log("importing ERC20POLYGON exchange...");
  try {
    const [erc20polygonExchange, hash] = await fetchTokens<ERC20POLYGONExchange>(
      "exchange/erc20polygon.json",
    );
    fs.writeFileSync(
      `${outputDir}/exchange/erc20polygon.json`,
      JSON.stringify(erc20polygonExchange),
    );
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/erc20polygon-hash.json`, JSON.stringify(hash));
    }

    const erc20polygontypeStringified = `export type ERC20POLYGONExchange = [string, string, string];`;
    const hashStringified = hash
      ? `export { default as hash } from "./erc20polygon-hash.json";`
      : "";
    const exchangesStringified = `import exchanges from "./erc20polygon.json";`;
    const exportStringified = `export default exchanges as ERC20POLYGONExchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/erc20polygon.ts`,
      `${erc20polygontypeStringified}

${hashStringified}

${exchangesStringified}

${exportStringified}
`,
    );

    console.log("importing ERC20POLYGON exchange success");
  } catch (err) {
    console.error(err);
  }
};
