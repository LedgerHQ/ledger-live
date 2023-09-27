import fs from "fs";
import { log } from "console";
import { fetchTokens } from "../../fetch";

export type EVMToken = [
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

export const importEVMTokens = async (outputDir: string) => {
  try {
    const supportedChainIds = [
      1, 3, 5, 10, 25, 30, 40, 56, 57, 106, 137, 199, 246, 250, 420, 592, 1088, 1101, 1284, 1442,
      8217, 42161, 84531, 421613,
    ];

    const chainNames: string[] = [];

    log("Importing evm tokens...");

    for await (const chainId of supportedChainIds) {
      log(`importing chain with chainId: ${chainId}...`);
      const erc20 = await fetchTokens<EVMToken[]>(`evm/${chainId}/erc20.json`);
      const erc20Signatures = await fetchTokens<string>(`evm/${chainId}/erc20-signatures.json`);
      const indexTsStringified = `import tokens from "./erc20.json";
import signatures from "./erc20-signatures.json";
export default { tokens, signatures };
`;

      if (erc20 && erc20Signatures) {
        const [coinName] = erc20[0];
        chainNames.push(coinName);
        fs.writeFileSync(`${outputDir}/evm/${chainId}/erc20.json`, JSON.stringify(erc20));
        fs.writeFileSync(
          `${outputDir}/evm/${chainId}/erc20-signatures.json`,
          JSON.stringify(erc20Signatures),
        );
        fs.writeFileSync(`${outputDir}/evm/${chainId}/index.ts`, indexTsStringified);

        log(`importing chain with chainId: ${chainId} (${coinName}) success`);
      }
    }

    const rootIndexStringified = `${supportedChainIds
      .map((chainId, index) => `import ${chainNames[index]}_tokens from "./${chainId}/erc20.json"`)
      .join(";" + String.fromCharCode(10))};

${supportedChainIds
  .map(
    (chainId, index) =>
      `import ${chainNames[index]}_signatures from "./${chainId}/erc20-signatures.json"`,
  )
  .join(";" + String.fromCharCode(10))};

export const tokens = {
${supportedChainIds
  .map((chainId, index) => `  ${chainId}: ${chainNames[index]}_tokens`)
  .join("," + String.fromCharCode(10))},
};
 
export const signatures = {
${supportedChainIds
  .map((chainId, index) => `  ${chainId}: ${chainNames[index]}_signatures`)
  .join("," + String.fromCharCode(10))},
};

export default {
  tokens,
  signatures,
};
`;

    fs.writeFileSync(`${outputDir}/evm/index.ts`, rootIndexStringified);

    log("Importing evm tokens success");
  } catch (err) {
    console.error(err);
  }
};
