// TDOD: confirm with @kvn but might be a duplicate of what is inside cryptoassets/data/evm/*/erc20.json
// If still useful should add validation checks
import { log } from "console";
import fs from "fs";
import { fetchTokens } from "../fetch";

export type ERC20Token = [
  string, // parent currecncy id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter values
  boolean, // delisted
  string?, // countervalue_ticker (legacy)
  string?, // coumpound_for (legacy)
];

export const importERC20 = async (outputDir: string) => {
  try {
    log("importing ERC20 tokens....");
    const erc20 = await fetchTokens("erc20.json");

    if (erc20) {
      fs.writeFileSync(`${outputDir}/erc20.json`, JSON.stringify(erc20));

      const erc20TokenTypeStringified = `export type ERC20Token = [
  string, // parent currecncy id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter values
  boolean, // delisted
  string?, // countervalue_ticker (legacy)
  string?, // coumpound_for (legacy)
];`;

      const tokensStringified = `const tokens: ERC20Token[] = ${JSON.stringify(erc20, null, 2)}`;
      const exportStringified = `export default tokens;`;

      const erc20TsFile = `${erc20TokenTypeStringified}

${tokensStringified}

${exportStringified}
`;

      fs.writeFileSync(`${outputDir}/erc20.ts`, erc20TsFile);

      log("importing ERC20 tokens: success");
    }
  } catch (err) {
    console.error(err);
  }
};
