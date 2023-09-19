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
    const bep20 = await fetchTokens<BEP20Token[]>("bep20.json");
    const filePath = path.join(outputDir, "bep20");
    if (bep20) {
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(bep20));

      const BEP20TokenTypeStringified = `export type BEP20Token = [
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
];`;

      const tokensStringified = `const tokens: BEP20Token[] = ${JSON.stringify(bep20, null, 2)};`;
      const exportStringified = `export default tokens;`;

      fs.writeFileSync(
        `${filePath}.ts`,
        `${BEP20TokenTypeStringified}

${tokensStringified}

${exportStringified}
`,
      );

      console.log("import BEP 20 tokens success");
    }
  } catch (err) {
    console.error(err);
  }
};
