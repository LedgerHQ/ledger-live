import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type ERC20Token = [
  string, // parent currecncy id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
  (string | null)?, // coumpound_for (legacy)
];

export const importERC20 = async (outputDir: string) => {
  try {
    console.log("importing ERC20 tokens....");
    const erc20 = await fetchTokens<ERC20Token>("erc20.json");

    if (erc20) {
      const filePath = path.join(outputDir, "erc20");
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(erc20));

      const erc20TokenTypeStringified = `export type ERC20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter values
  boolean, // delisted
  (string | null)?, // countervalue_ticker (legacy)
  (string | null)?, // coumpound_for (legacy)
];`;

      const erc20TsFile = `${erc20TokenTypeStringified}

import tokens from "./erc20.json";

export default tokens as ERC20Token[];
`;

      fs.writeFileSync(`${filePath}.ts`, erc20TsFile);

      console.log("importing ERC20 tokens: success");
    }
  } catch (err) {
    console.error(err);
  }
};
