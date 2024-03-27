import fs from "fs";
import { fetchTokens } from "../fetch";

type BEP20Exchange = [string, string, string];

export const importBEP20Exchange = async (outputDir: string) => {
  console.log("importing bep 20 exchange tokens...");
  try {
    const [bep20Exchange, hash] = await fetchTokens<BEP20Exchange>("exchange/bep20.json");
    fs.writeFileSync(`${outputDir}/exchange/bep20.json`, JSON.stringify(bep20Exchange));
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/bep20-hash.json`, JSON.stringify(hash));
    }

    const bep20ExchangeTypeStringified = `export type BEP20Exchange = [string, string, string];`;
    const hashStringified = hash ? `export { default as hash } from "./bep20-hash.json";` : "";
    const tokensStringified = `import tokens from "./bep20.json";`;
    const exportstringified = `export default tokens as BEP20Exchange[];`;

    const tsFile = `${bep20ExchangeTypeStringified}

${hashStringified}

${tokensStringified}

${exportstringified}
`;

    fs.writeFileSync(`${outputDir}/exchange/bep20.ts`, tsFile);
    console.log("importing bep 20 exchange tokens success");
  } catch (err) {
    console.error(err);
  }
};
