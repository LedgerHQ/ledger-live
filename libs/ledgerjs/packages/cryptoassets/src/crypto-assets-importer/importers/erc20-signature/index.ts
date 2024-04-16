import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

export const importERC20Signatures = async (outputDir: string) => {
  console.log("importing erc20 signatures...");
  try {
    const [erc20Signatures, hash] = await fetchTokens<string>("erc20-signatures.json");
    const filePath = path.join(outputDir, "erc20-signatures");
    if (erc20Signatures) {
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(erc20Signatures));
      if (hash) {
        fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
      }

      fs.writeFileSync(
        `${filePath}.ts`,
        `import ERC20Signatures from "./erc20-signatures.json";

${hash ? `export { default as hash } from "./erc20-signatures-hash.json";` : null}

export default ERC20Signatures;
`,
      );
      console.log("importing erc20 signatures: success");
    }
  } catch (err) {
    console.error(err);
  }
};
