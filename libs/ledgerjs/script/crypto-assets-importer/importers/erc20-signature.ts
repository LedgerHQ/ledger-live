import { log } from "console";
import fs from "fs";
import { fetchTokens } from "../fetch";

export const importERC20Signatures = async (outputDir: string) => {
  log("importing erc20 signatures...");
  try {
    const erc20Signatures = await fetchTokens<string>("erc20-signatures.json");
    if (erc20Signatures) {
      fs.writeFileSync(`${outputDir}/erc20-signatures.json`, JSON.stringify(erc20Signatures));
      fs.writeFileSync(
        `${outputDir}/erc20-signatures.ts`,
        `export default ${JSON.stringify(erc20Signatures, null, 2)};`,
      );
      log("importing erc20 signatures: success");
    }
  } catch (err) {
    console.error(err);
  }
};
