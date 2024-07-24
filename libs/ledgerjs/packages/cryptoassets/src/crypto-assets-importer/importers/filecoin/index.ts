import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type FilecoinERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract eth address
  //   string, // contract fil address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
];

export const importFilecoinERC20Tokens = async (outputDir: string) => {
  try {
    console.log("importing filecoin erc20 tokens...");
    const [erc20tokens, hash] = await fetchTokens<FilecoinERC20Token[]>("evm/314/erc20.json");
    const filePath = path.join(outputDir, "filecoin-erc20");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(erc20tokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `export type FilecoinERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract eth address
  //   string, // contract fil address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
];

import tokens from "./filecoin-erc20.json";

${hash ? `export { default as hash } from "./filecoin-erc20-hash.json";` : ""}

export default tokens as FilecoinERC20Token[];
`,
    );

    console.log("importing filecoin erc20 tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
