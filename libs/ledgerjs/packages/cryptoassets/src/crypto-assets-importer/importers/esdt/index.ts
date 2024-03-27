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
  try {
    console.log("importing esdt tokens...");
    const [esdtTokens, hash] = await fetchTokens<ElrondESDTToken[]>("esdt.json");
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
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${estTypeStringified}

import tokens from "./esdt.json";

${hash ? `export { default as hash } from "./esdt-hash.json";` : null}

export default tokens as ElrondESDTToken[];
`,
    );

    console.log("importing esdt tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
