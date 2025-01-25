import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";
import { getErc20DescriptorsAndSignatures } from "../../utils";

export const importFilecoinERC20Tokens = async (outputDir: string) => {
  try {
    console.log("importing filecoin erc20 tokens...");
    const { tokens, hash } = await fetchTokensFromCALService(
      {
        chainId: 314,
        standard: "erc20",
      },
      [
        "blockchain_name",
        "id",
        "ticker",
        "decimals",
        "name",
        "live_signature",
        "contract_address",
        "delisted",
      ],
    );
    const { erc20 } = getErc20DescriptorsAndSignatures(tokens, 314);

    const filePath = path.join(outputDir, "filecoin-erc20");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(erc20));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `import { ERC20Token } from "../types";

import tokens from "./filecoin-erc20.json";

${hash ? `export { default as hash } from "./filecoin-erc20-hash.json";` : ""}

export default tokens as ERC20Token[];
`,
    );

    console.log("importing filecoin erc20 tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
