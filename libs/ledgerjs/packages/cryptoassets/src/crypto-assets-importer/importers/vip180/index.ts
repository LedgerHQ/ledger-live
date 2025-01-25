import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type Vip180Token = [
  string, // token identifier
  string, // ticker
  string, // name
  string, // contract address
  number, // decimals
];

export const importVip180Tokens = async (outputDir: string) => {
  try {
    console.log("importing Vechain tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "vechain" }, [
      "id",
      "ticker",
      "name",
      "contract_address",
      "decimals",
    ]);
    const vip180Tokens: Vip180Token[] = tokens.map(token => {
      // This shouldn't be necessary, we should consumme the ID directly
      // but for now, I'll keep this to maintain a compatibility layer
      // with the content of the CDN (which should be removed soon)
      const [, , tokenIdentifier] = token.id.split("/");

      return [tokenIdentifier, token.ticker, token.name, token.contract_address, token.decimals];
    });

    const filePath = path.join(outputDir, "vip180");
    const vip180TypeStringified = `export type Vip180Token = [
  string, // token identifier
  string, // ticker
  string, // name
  string, // contract address
  number, // decimals
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(vip180Tokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }
    fs.writeFileSync(
      `${filePath}.ts`,
      `${vip180TypeStringified}

import tokens from "./vip180.json";

${hash ? `export { default as hash } from "./vip180-hash.json";` : ""}

export default tokens as Vip180Token[];
`,
    );

    console.log("importing Vechain tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
