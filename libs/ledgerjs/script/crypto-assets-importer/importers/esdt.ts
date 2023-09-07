import fs from "fs";
import { log } from "console";
import { fetchTokens } from "../fetch";

export type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  boolean, // disableCountervalue
];

export const importESDTTokens = async (outputFolder: string) => {
  log("importing esdt tokens...");
  const esdtTokens = await fetchTokens<ElrondESDTToken[]>("esdt.json");
  fs.writeFileSync(`${outputFolder}/esdt.json`, JSON.stringify(esdtTokens));
  fs.writeFileSync(
    `${outputFolder}/esdt.ts`,
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
