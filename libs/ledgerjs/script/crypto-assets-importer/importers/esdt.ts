import fs from "fs";
import { log } from "console";
import path from "path";
import { fetchTokens } from "../fetch";

type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];

export const importESDTTokens = async (outputDir: string) => {
  log("importing esdt tokens...");
  const esdtTokens = await fetchTokens<ElrondESDTToken[]>("esdt.json");
  const filePath = path.join(outputDir, "esdt");
  fs.writeFileSync(`${filePath}.json`, JSON.stringify(esdtTokens));
  fs.writeFileSync(
    `${filePath}.ts`,
    `export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];

import tokens from "./esdt.json";

export default tokens as ElrondESDTToken[];
`,
  );

  log("importing esdt tokens sucess");
};
