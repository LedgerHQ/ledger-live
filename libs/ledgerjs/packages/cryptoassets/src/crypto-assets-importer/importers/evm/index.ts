import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { fetchTokensFromCALService } from "../../fetch";
import { cryptocurrenciesById } from "../../../currencies";
import { getErc20DescriptorsAndSignatures } from "../../utils";

const chainNames = new Map<number, string>();

export const importTokenByChainId = async (outputDir: string, chainId: number) => {
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
    const { erc20, erc20Signatures } = getErc20DescriptorsAndSignatures(tokens, chainId);

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
  console.log("Importing evm tokens...");

  const supportedChainIds = Object.values(cryptocurrenciesById)
    .filter(cryptocurrency => cryptocurrency.ethereumLikeInfo?.chainId)
    .map(cryptocurrency => cryptocurrency.ethereumLikeInfo!.chainId)
    .sort((a, b) => a - b);

  await Promise.allSettled(
    supportedChainIds.map(chainId => importTokenByChainId(outputDir, chainId)),
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
