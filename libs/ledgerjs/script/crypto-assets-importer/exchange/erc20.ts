import { log } from "console";
import fs from "fs";
import { fetchTokens } from "../fetch";

type ERC20Exchange = [string, string, string];

export const importERC20Exchange = async (outputDir: string) => {
  log("importing ERC20 exchange...");
  try {
    const erc20Exchange = await fetchTokens<ERC20Exchange>("exchange/erc20.json");
    fs.writeFileSync(`${outputDir}/exchange/erc20.json`, JSON.stringify(erc20Exchange));

    const erc20typeStringified = `export type ERC20Exchange = [string, string, string];`;
    const tokensStringified = `const exchanges: ERC20Exchange[] = ${JSON.stringify(
      erc20Exchange,
      null,
      2,
    )};`;
    const exportStringified = `export default exchanges;`;

    fs.writeFileSync(
      `${outputDir}/exchange/erc20.ts`,
      `${erc20typeStringified}

${tokensStringified}

${exportStringified}
`,
    );

    log("importing ERC20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
