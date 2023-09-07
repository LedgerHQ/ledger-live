import fs from "fs";
import { log } from "console";
import { fetchTokens } from "../fetch";

export type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];

export const importSPLTokens = async (outputFolder: string) => {
  log("importing spl tokens...");
  const splTokens = await fetchTokens<SPLToken[]>("asa.json");
  fs.writeFileSync(`${outputFolder}/spl.json`, JSON.stringify(splTokens));
  fs.writeFileSync(
    `${outputFolder}/spl.ts`,
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
