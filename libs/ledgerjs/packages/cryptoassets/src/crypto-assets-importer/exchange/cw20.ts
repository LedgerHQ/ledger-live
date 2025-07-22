import fs from "fs";
import { fetchTokensFromCDN } from "../fetch";

// CW20 tokens usually have at least: [contract address, symbol, name]
type CW20Exchange = [string, string, string];

export const importCW20Exchange = async (outputDir: string) => {
  console.log("importing CW20 exchange...");
  try {
    const [cw20Exchange, hash] = await fetchTokensFromCDN<CW20Exchange>("exchange/cw20.json");
    fs.writeFileSync(`${outputDir}/exchange/cw20.json`, JSON.stringify(cw20Exchange));
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/cw20-hash.json`, JSON.stringify(hash));
    }

    const cw20typeStringified = `export type CW20Exchange = [string, string, string];`;
    const hashStringified = hash ? `export { default as hash } from "./cw20-hash.json";` : "";
    const exchangesStringified = `import exchanges from "./cw20.json";`;
    const exportStringified = `export default exchanges as CW20Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/cw20.ts`,
      `${cw20typeStringified}

${hashStringified}

${exchangesStringified}

${exportStringified}
`,
    );

    console.log("importing CW20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
