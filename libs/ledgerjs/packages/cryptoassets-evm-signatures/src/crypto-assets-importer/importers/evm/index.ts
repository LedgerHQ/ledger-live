import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { fetchTokensFromCALService, fetchTokensOrderedByMarketCap } from "../../fetch";
import { getErc20DescriptorsAndSignatures } from "../../utils";

const LIMIT_TOKENS_BY_CHAIN = 100;

const mustHaveForTests = [
  "0xe41d2489571d322189246dafa5ebde1f4699f498",
  "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
];

const chainNames = new Map<number, string>();
export const importTokenByChainId = async (
  outputDir: string,
  chainId: number,
  tokensOrderedByMarketCap: string[],
) => {
  try {
    console.log(`importing chain with chainId: ${chainId}...`);
    const { tokens, hash } = await fetchTokensFromCALService(
      {
        chainId,
        standard: chainId === 56 ? "bep20" : "erc20",
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

    if (!tokens[0]) {
      console.warn(`no tokens found for chainId: ${chainId}`);
      return;
    }
    const chainName = tokens[0]?.blockchain_name;
    const topTokensByMarketCap = tokensOrderedByMarketCap
      .filter(token => token.startsWith(chainName))
      .slice(0, LIMIT_TOKENS_BY_CHAIN);
    if (!chainName) {
      console.warn(`no chainName found for chainId: ${chainId}`);
    }
    const tokensFiltered = tokens.filter((token: any) => {
      return (
        topTokensByMarketCap.includes(token.id) || mustHaveForTests.includes(token.contract_address)
      );
    });

    const { erc20, erc20Signatures } = getErc20DescriptorsAndSignatures(tokensFiltered, chainId);

    const indexTsStringified = `import { ERC20Token } from "../../../types";
import erc20 from "./erc20.json";
export const tokens = erc20 as ERC20Token[];
export { default as signatures } from "./erc20-signatures.json";
${hash ? `export { default as hash } from "./erc20-hash.json";` : ""}
`;

    if (erc20?.length && erc20Signatures?.length) {
      const dirPath = path.join(outputDir, "evm", chainId.toString());
      if (!existsSync(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true });
      }

      const [currencyName] = erc20[0];
      chainNames.set(chainId, currencyName);
      await fs.writeFile(path.join(dirPath, "erc20.json"), JSON.stringify(erc20));
      if (hash) {
        await fs.writeFile(path.join(dirPath, "erc20-hash.json"), JSON.stringify(hash));
      }

      await fs.writeFile(
        path.join(dirPath, "erc20-signatures.json"),
        JSON.stringify(erc20Signatures.toString("base64")),
      );
      await fs.writeFile(path.join(dirPath, "index.ts"), indexTsStringified);

      console.log(`importing chain with chainId: ${chainId} (${currencyName}) success`);
    }
  } catch (err) {
    console.error(err);
  }
};

export const importEVMTokens = async (outputDir: string) => {
  console.log("Importing evm tokens... --------");
  const { tokens } = await fetchTokensOrderedByMarketCap();

  const supportedChainIds = [
    1, 10, 14, 19, 25, 30, 40, 42, 56, 57, 61, 106, 137, 199, 246, 250, 288, 592, 1088, 1101, 1284,
    1285, 1442, 8217, 8453, 17000, 42161, 43114, 59141, 59144, 81457, 84532, 421614, 534351, 534352,
    11155111, 11155420, 168587773, 245022934,
  ];

  await Promise.allSettled(
    supportedChainIds.map(chainId => importTokenByChainId(outputDir, chainId, tokens)),
  );

  const rootIndexStringified = `import { ERC20Token } from "../../types";

${supportedChainIds
  .map(chainId =>
    chainNames.has(chainId)
      ? `import ${chainNames.get(chainId)}_tokens from "./${chainId}/erc20.json"`
      : null,
  )
  .filter(Boolean)
  .join(";" + String.fromCharCode(10))};

${supportedChainIds
  .map(chainId =>
    chainNames.has(chainId) &&
    existsSync(path.join(outputDir, "evm", chainId.toString(), "erc20-hash.json"))
      ? `import ${chainNames.get(chainId)}_tokens_hash from "./${chainId}/erc20-hash.json"`
      : null,
  )
  .filter(Boolean)
  .join(";" + String.fromCharCode(10))};

${supportedChainIds
  .map(chainId =>
    chainNames.has(chainId)
      ? `import ${chainNames.get(chainId)}_signatures from "./${chainId}/erc20-signatures.json"`
      : null,
  )
  .filter(Boolean)
  .join(";" + String.fromCharCode(10))};

export const tokens = {
${supportedChainIds
  .map(chainId =>
    chainNames.has(chainId)
      ? `  ${chainId}: ${chainNames.get(chainId)}_tokens as ERC20Token[]`
      : null,
  )
  .filter(Boolean)
  .join("," + String.fromCharCode(10))},
};

export const signatures = {
${supportedChainIds
  .map(chainId =>
    chainNames.has(chainId) ? `  ${chainId}: ${chainNames.get(chainId)}_signatures` : null,
  )
  .filter(Boolean)
  .join("," + String.fromCharCode(10))},
};

export const hashes = {
${supportedChainIds
  .map(chainId =>
    chainNames.has(chainId) &&
    existsSync(path.join(outputDir, "evm", chainId.toString(), "erc20-hash.json"))
      ? `  ${chainId}: ${chainNames.get(chainId)}_tokens_hash`
      : null,
  )
  .filter(Boolean)
  .join("," + String.fromCharCode(10))},
};

export default {
  tokens,
  signatures,
  hashes,
};
`;

  await fs.writeFile(`${outputDir}/evm/index.ts`, rootIndexStringified);

  console.log("Importing evm tokens success");
};
