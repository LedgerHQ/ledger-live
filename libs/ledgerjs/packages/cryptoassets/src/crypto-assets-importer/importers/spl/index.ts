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
    const [splTokens, hash] = await fetchTokens<SPLToken[]>("spl.json");
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
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }
    fs.writeFileSync(
      `${filePath}.ts`,
      `${splTypeStringified}

import tokens from "./spl.json";

${hash ? `export { default as hash } from "./spl-hash.json";` : null}

export default tokens as SPLToken[];
`,
    );

    console.log("importing spl tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
