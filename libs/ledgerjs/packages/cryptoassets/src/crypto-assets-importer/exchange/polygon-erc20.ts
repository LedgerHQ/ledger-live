import fs from "fs";
import { fetchTokens } from "../fetch";

type PolygonERC20Exchange = [string, string, string];

export const importPolygonERC20Exchange = async (outputDir: string) => {
  console.log("importing Polygon-ERC20 exchange...");
  try {
    const [polygonERC20Exchange, hash] = await fetchTokens<PolygonERC20Exchange>(
      "evm/137/erc20-exchange.json",
    );
    fs.writeFileSync(
      `${outputDir}/exchange/polygon-erc20.json`,
      JSON.stringify(polygonERC20Exchange),
    );
    if (hash) {
      fs.writeFileSync(`${outputDir}/exchange/polygon-erc20-hash.json`, JSON.stringify(hash));
    }

    const polygonerc20typeStringified = `export type PolygonERC20Exchange = [string, string, string];`;
    const hashStringified = hash
      ? `export { default as hash } from "./polygon-erc20-hash.json";`
      : "";
    const exchangesStringified = `import exchanges from "./polygon-erc20.json";`;
    const exportStringified = `export default exchanges as PolygonERC20Exchange[];`;

    fs.writeFileSync(
      `${outputDir}/exchange/polygon-erc20.ts`,
      `${polygonerc20typeStringified}

${hashStringified}

${exchangesStringified}

${exportStringified}
`,
    );

    console.log("importing Polygon-ERC20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
