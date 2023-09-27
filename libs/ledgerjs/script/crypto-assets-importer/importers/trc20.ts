import fs from "fs";
import { log } from "console";
import path from "path";
import { fetchTokens } from "../fetch";

type TRC20Token = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // delisted
  string?, // ledgerSignature
  boolean?, // enableCountervalues
];

export const importTRC20Tokens = async (outputDir: string) => {
  log("importing trc20 tokens...");
  const trc20tokens = await fetchTokens<TRC20Token[]>("trc20.json");
  const filePath = path.join(outputDir, "trc20");
  fs.writeFileSync(`${filePath}.json`, JSON.stringify(trc20tokens));
  fs.writeFileSync(
    `${filePath}.ts`,
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
