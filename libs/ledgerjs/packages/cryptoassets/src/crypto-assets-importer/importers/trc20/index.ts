import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

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
  try {
    console.log("importing trc20 tokens...");
    const trc20tokens = await fetchTokens<TRC20Token[]>("trc20.json");
    const filePath = path.join(outputDir, "trc20");

    const trc20TypeStringified = `export type TRC20Token = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // delisted
  string?, // ledgerSignature
  boolean?, // enableCountervalues
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(trc20tokens));
    fs.writeFileSync(
      `${filePath}.ts`,
      `${trc20TypeStringified}

import tokens from "./trc20.json";

export default tokens as TRC20Token[];
`,
    );

    console.log("importing trc20 tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
