import fs from "fs";
import { fetchTokens } from "../fetch";

type ERC20Exchange = [string, string, string];

export const importERC20Exchange = async (outputDir: string) => {
  console.log("importing ERC20 exchange...");
  try {
    const [erc20Exchange, hash] = await fetchTokens<ERC20Exchange>("exchange/erc20.json");
    fs.writeFileSync(`${outputDir}/exchange/erc20.json`, JSON.stringify(erc20Exchange));
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/erc20-hash.json`, JSON.stringify(hash));
    }

    const erc20typeStringified = `export type ERC20Exchange = [string, string, string];`;
    const hashStringified = hash ? `export { default as hash } from "./erc20-hash.json";` : "";
    const tokensStringified = `import exchanges from "./erc20.json";`;
    const exportStringified = `export default exchanges as ERC20Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/erc20.ts`,
      `${erc20typeStringified}

${hashStringified}

${tokensStringified}

${exportStringified}
`,
    );

    console.log("importing ERC20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
