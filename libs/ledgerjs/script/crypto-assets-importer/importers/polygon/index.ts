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
  console.log("importing polygon tokens...");
  const polygonTokens = await fetchTokens<PolygonToken[]>("polygon-erc20.json");
  if (polygonTokens) {
    const filePath = path.join(outputDir, "polygon-erc20");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(polygonTokens));

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

export default tokens as PolygonERC20Token[];
`,
    );

    console.log("import polygon tokens success");
  }
};
