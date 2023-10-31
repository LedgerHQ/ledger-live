import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];

export const importESDTTokens = async (outputDir: string) => {
  console.log("importing esdt tokens...");
  const esdtTokens = await fetchTokens<ElrondESDTToken[]>("esdt.json");
  const filePath = path.join(outputDir, "esdt");

  const estTypeStringified = `export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];`;

  fs.writeFileSync(`${filePath}.json`, JSON.stringify(esdtTokens));
  fs.writeFileSync(
    `${filePath}.ts`,
    `${estTypeStringified}

import tokens from "./esdt.json";

export default tokens as ElrondESDTToken[];
`,
  );

  console.log("importing esdt tokens sucess");
};
