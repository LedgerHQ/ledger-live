import fs from "fs";
import { log } from "console";
import { fetchTokens } from "../fetch";

export type TRC20Token = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // delisted
  string?, // ledgerSignature
  boolean?, // enableCountervalues
];

export const importTRC20Tokens = async (outputFolder: string) => {
  log("importing trc20 tokens...");
  const trc20tokens = await fetchTokens<TRC20Token[]>("trc20.json");
  fs.writeFileSync(`${outputFolder}/trc20.json`, JSON.stringify(trc20tokens));
  fs.writeFileSync(
    `${outputFolder}/trc20.ts`,
    `export type TRC20Token = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // delisted
  string?, // ledgerSignature
  boolean?, // enableCountervalues
];

import tokens from "./trc20.json";

export default tokens as TRC20Token[];
`,
  );

  log("importing trc20 tokens sucess");
};
