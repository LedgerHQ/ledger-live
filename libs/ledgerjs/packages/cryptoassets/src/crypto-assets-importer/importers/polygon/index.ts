import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type PolygonToken = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter value
  boolean, // delisted
  (string | null)?, // legacy
  (string | null)?, // legacy
];

export const importPolygonTokens = async (outputDir: string) => {
  try {
    console.log("importing polygon tokens...");
    const [polygonTokens, hash] = await fetchTokens<PolygonToken[]>("polygon-erc20.json");

    const filePath = path.join(outputDir, "polygon-erc20");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(polygonTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    const tokenTypeStringified = `export type PolygonERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter value
  boolean, // delisted
  (string | null)?, // legacy
  (string | null)?, // legacy
];`;

    fs.writeFileSync(
      `${filePath}.ts`,
      `${tokenTypeStringified}

import tokens from "./polygon-erc20.json";

${hash ? `export { default as hash } from "./polygon-erc20-hash.json";` : null}

export default tokens as PolygonERC20Token[];
`,
    );

    console.log("import polygon tokens success");
  } catch (err) {
    console.error(err);
  }
};
