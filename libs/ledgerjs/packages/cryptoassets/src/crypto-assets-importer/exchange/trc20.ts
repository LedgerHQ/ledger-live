import fs from "fs";
import { fetchTokens } from "../fetch";

type TRC20Exchange = [string, string, string];

export const importTRC20Exchange = async (outputDir: string) => {
  console.log("importing TRC20 exchange...");
  try {
    const trc20Exchange = await fetchTokens<TRC20Exchange>("exchange/trc20.json");
    fs.writeFileSync(`${outputDir}/exchange/trc20.json`, JSON.stringify(trc20Exchange));

    const trc20typeStringified = `export type TRC20Exchange = [string, string, string];`;
    const tokensStringified = `import exchanges from "./trc20.json";`;
    const exportStringified = `export default exchanges as TRC20Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/trc20.ts`,
      `${trc20typeStringified}

${tokensStringified}

${exportStringified}
`,
    );

    console.log("importing TRC20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
