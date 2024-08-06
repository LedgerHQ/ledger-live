import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type ElrondESDTToken = [
  string, // ticker
  string, // identifier
  number, // decimals
  string, // signature
  string, // name
  false, // [deprecated] disableCountervalue
];

export const importESDTTokens = async (outputDir: string) => {
  try {
    console.log("importing esdt tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "elrond" }, [
      "ticker",
      "id",
      "decimals",
      "live_signature",
      "name",
    ]);
    const esdtTokens: ElrondESDTToken[] = tokens.map(token => {
      // This shouldn't be necessary, we should consumme the ID directly
      // but for now, I'll keep this to maintain a compatibility layer
      // with the content of the CDN (which should be removed soon)
      const [, , tokenIdentifier] = token.id.split("/");

      return [
        token.ticker,
        tokenIdentifier,
        token.decimals,
        token.live_signature,
        token.name,
        false,
      ];
    });

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

${hash ? `export { default as hash } from "./esdt-hash.json";` : ""}

export default tokens as ElrondESDTToken[];
`,
    );

    console.log("importing esdt tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
