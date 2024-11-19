import fs from "fs";
import { fetchTokensFromCDN } from "../fetch";

type TRC20Exchange = [string, string, string];

export const importTRC20Exchange = async (outputDir: string) => {
  console.log("importing TRC20 exchange...");
  try {
    const [trc20Exchange, hash] = await fetchTokensFromCDN<TRC20Exchange>("exchange/trc20.json");
    fs.writeFileSync(`${outputDir}/exchange/trc20.json`, JSON.stringify(trc20Exchange));
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/trc20-hash.json`, JSON.stringify(hash));
    }

    const trc20typeStringified = `export type TRC20Exchange = [string, string, string];`;
    const hashStringified = hash ? `export { default as hash } from "./trc20-hash.json";` : "";
    const exchangesStringified = `import exchanges from "./trc20.json";`;
    const exportStringified = `export default exchanges as TRC20Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/trc20.ts`,
      `${trc20typeStringified}

${hashStringified}

${exchangesStringified}

${exportStringified}
`,
    );

    console.log("importing TRC20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
