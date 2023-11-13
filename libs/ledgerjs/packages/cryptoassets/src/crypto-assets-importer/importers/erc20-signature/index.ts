import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

export const importERC20Signatures = async (outputDir: string) => {
  console.log("importing erc20 signatures...");
  try {
    const erc20Signatures = await fetchTokens<string>("erc20-signatures.json");
    const filePath = path.join(outputDir, "erc20-signatures");
    if (erc20Signatures) {
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(erc20Signatures));
      fs.writeFileSync(
        `${filePath}.ts`,
        `export default ${JSON.stringify(erc20Signatures, null, 2)};`,
      );
      console.log("importing erc20 signatures: success");
    }
  } catch (err) {
    console.error(err);
  }
};
