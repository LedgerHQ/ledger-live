import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];

export const importSPLTokens = async (outputDir: string) => {
  try {
    console.log("importing spl tokens...");
    const splTokens = await fetchTokens<SPLToken[]>("spl.json");
    const filePath = path.join(outputDir, "spl");

    const splTypeStringified = `export type SPLToken = [
  number, // chainId
  string, // name
  string, // symbol
  string, // address
  number, // decimals
  boolean?, // enableCountervalues
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(splTokens));
    fs.writeFileSync(
      `${filePath}.ts`,
      `${splTypeStringified}

import tokens from "./spl.json";

export default tokens as SPLToken[];
`,
    );

    console.log("importing spl tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
