import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // enableCountervalues
];

export const importAsaTokens = async (outputDir: string) => {
  try {
    console.log("importing asa tokens...");
    const asaTokens = await fetchTokens<AlgorandASAToken[]>("asa.json");
    const filePath = path.join(outputDir, "asa");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(asaTokens));
    fs.writeFileSync(
      `${filePath}.ts`,
      `export type AlgorandASAToken = [
  string, // id
  string, // abbr
  string, // name
  string, // contractAddress
  number, // precision
  boolean?, // enableCountervalues
];

import tokens from "./asa.json";

export default tokens as AlgorandASAToken[];
`,
    );

    console.log("importing asa tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
