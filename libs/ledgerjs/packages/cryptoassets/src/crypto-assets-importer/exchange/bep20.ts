import fs from "fs";
import { fetchTokens } from "../fetch";

type BEP20Exchange = [string, string, string];

export const importBEP20Exchange = async (outputDir: string) => {
  console.log("importing bep 20 exchange tokens...");
  try {
    const bep20Exchange = await fetchTokens<BEP20Exchange>("exchange/bep20.json");
    fs.writeFileSync(`${outputDir}/exchange/bep20.json`, JSON.stringify(bep20Exchange));

    const bep20ExchangeTypeStringified = `export type BEP20Exchange = [string, string, string];`;
    const tokensStringified = `import tokens from "./bep20.json";`;
    const exportstringified = `export default tokens as BEP20Exchange[];`;

    const tsFile = `${bep20ExchangeTypeStringified}

${tokensStringified}

${exportstringified}
`;

    fs.writeFileSync(`${outputDir}/exchange/bep20.ts`, tsFile);
    console.log("importing bep 20 exchange tokens success");
  } catch (err) {
    console.error(err);
  }
};
