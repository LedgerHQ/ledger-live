import fs from "fs";
import path from "path";
import { type CALServiceOutput, fetchTokensFromCALService } from "../../fetch";

type HederaToken = [
  string, // id
  string, // tokenId
  string, // name
  string, // ticker
  string, // network
  number, // decimals
  boolean, // delisted
];

// FIXME: remove ERC20 overrides once CAL is fixed (solution is under discussion).
// For now, API returns wrong tokenType and is missing EVM contractAddress for these tokens.
const HEDERA_ERC20_OVERRIDES: Record<string, Partial<CALServiceOutput>> = {
  // AUDD https://hashscan.io/mainnet/contract/0.0.8317070
  "0.0.8317070": {
    id: "hedera/erc20/audd_0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    contract_address: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
  },
  // amUSDC https://hashscan.io/mainnet/contract/0.0.7308496
  "0.0.7308496": {
    id: "hedera/erc20/bonzo_atoken_usdc_0xb7687538c7f4cad022d5e97cc778d0b46457c5db",
    contract_address: "0xb7687538c7f4cad022d5e97cc778d0b46457c5db",
  },
  // WETH https://hashscan.io/mainnet/contract/0.0.9470869
  "0.0.9470869": {
    id: "hedera/erc20/weth_0xca367694cdac8f152e33683bb36cc9d6a73f1ef2",
    contract_address: "0xca367694cdac8f152e33683bb36cc9d6a73f1ef2",
  },
};

export const importHederaTokens = async (outputDir: string) => {
  try {
    console.log("importing hedera tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "hedera" }, [
      "id",
      "contract_address",
      "name",
      "ticker",
      "network",
      "decimals",
      "delisted",
    ]);
    const hederaTokens: HederaToken[] = tokens.map(token => [
      HEDERA_ERC20_OVERRIDES[token.contract_address]?.id ?? token.id,
      HEDERA_ERC20_OVERRIDES[token.contract_address]?.contract_address ?? token.contract_address,
      token.name,
      token.ticker,
      token.network,
      token.decimals,
      token.delisted,
    ]);

    const filePath = path.join(outputDir, "hedera");
    const hederaTypeStringified = `export type HederaToken = [
  string, // id
  string, // tokenId
  string, // name
  string, // ticker
  string, // network
  number, // decimals
  boolean, // delisted
];`;

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(hederaTokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `${hederaTypeStringified}

import tokens from "./hedera.json";

${hash ? `export { default as hash } from "./hedera-hash.json";` : ""}

export default tokens as HederaToken[];
`,
    );

    console.log("importing hedera tokens sucess");
  } catch (err) {
    console.error(err);
  }
};
