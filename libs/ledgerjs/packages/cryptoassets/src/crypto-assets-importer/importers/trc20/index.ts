import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type TRC20Token = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
  string?, // live signature
];

export const importTRC20Tokens = async (outputDir: string) => {
  try {
    console.log("importing trc20 tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "tron" }, [
      "id",
      "ticker",
      "name",
      "contract_address",
      "decimals",
      "delisted",
      "live_signature",
    ]);
    const trc20tokens: TRC20Token[] = tokens.map(token => {
      const [, , tokenIdentifier] = token.id.split("/");

      return [
        tokenIdentifier,
        token.ticker,
        token.name,
        token.contract_address,
        token.decimals,
        token.delisted,
        token.live_signature,
      ];
    });

    const filePath = path.join(outputDir, "trc20");
    const trc20TypeStringified = `export type TRC20Token = [
  string, // id
  string, // ticker
  string, // name
  string, // contractAddress
  number, // decimals
  boolean?, // delisted
  string?, // live signature
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(trc20tokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${trc20TypeStringified}

import tokens from "./trc20.json";

${hash ? `export { default as hash } from "./trc20-hash.json";` : ""}

export default tokens as TRC20Token[];
`,
    );

    console.log("importing trc20 tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
