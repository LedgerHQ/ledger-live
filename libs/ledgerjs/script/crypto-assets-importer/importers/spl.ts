import fs from "fs";
import { log } from "console";
import path from "path";
import { fetchTokens } from "../fetch";

type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];

export const importSPLTokens = async (outputDir: string) => {
  log("importing spl tokens...");
  const splTokens = await fetchTokens<SPLToken[]>("asa.json");
  const filePath = path.join(outputDir, "spl");
  fs.writeFileSync(`${filePath}.json`, JSON.stringify(splTokens));
  fs.writeFileSync(
    `${filePath}.ts`,
    `export type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];

import tokens from "./spl.json";

export default tokens as SPLToken[];
`,
  );

  log("importing spl tokens sucess");
};
