import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type BEP20Token = [
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
];

export const importBEP20 = async (outputDir: string) => {
  try {
    console.log("import BEP 20 tokens...");
    const [bep20, hash] = await fetchTokens<BEP20Token[]>("bep20.json");
    const filePath = path.join(outputDir, "bep20");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(bep20));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    if (bep20) {
      fs.writeFileSync(
        `${filePath}.ts`,
        `export type BEP20Token = [
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
];

import tokens from "./bep20.json";

${hash ? `export { default as hash } from "./bep20-hash.json";` : null}

export default tokens as BEP20Token[];
`,
      );

      console.log("import BEP 20 tokens success");
    }
  } catch (err) {
    console.error(err);
  }
};
