import fs from "fs";
import path from "path";
import { fetchTokensFromCALService } from "../../fetch";

type StacksSip010Token = [
  string, // contractAddress
  string, // contractName
  string, // assetName
  string, // displayName
  string, // ticker
  number, // decimals
  boolean, // delisted
  string, // live_signature
];

export const convertCALContractAddressToStacksSip010 = (fullIdentifier: string) => {
  let actualContractAddress = "";
  let contractName = "";
  let assetName = "";

  const dotIndex = fullIdentifier.lastIndexOf(".");
  if (dotIndex !== -1) {
    actualContractAddress = fullIdentifier.substring(0, dotIndex);
    const bothNames = fullIdentifier.substring(dotIndex + 1).split("::");
    contractName = bothNames[0];
    assetName = bothNames[1];
  } else {
    // Fallback if no dot found
    actualContractAddress = fullIdentifier;
  }

  return { actualContractAddress, contractName, assetName };
};

export const importStacksSip010Tokens = async (outputDir: string) => {
  try {
    console.log("importing stacks sip010 tokens...");
    const { tokens, hash } = await fetchTokensFromCALService({ blockchain_name: "stacks" }, [
      "contract_address",
      "name",
      "ticker",
      "decimals",
      "delisted",
      "live_signature",
    ]);
    const sip010Tokens: StacksSip010Token[] = tokens.map(token => {
      // Eg: SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc::bridged-btc
      const fullIdentifier = token.contract_address || "";

      const { actualContractAddress, assetName, contractName } =
        convertCALContractAddressToStacksSip010(fullIdentifier);

      return [
        actualContractAddress,
        contractName,
        assetName,
        token.name,
        token.ticker,
        token.decimals,
        token.delisted,
        token.live_signature,
      ];
    });

    const filePath = path.join(outputDir, "stacks-sip010");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(sip010Tokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    const templatePath = path.join(__dirname, "tokens.template.ts");
    let data = fs.readFileSync(templatePath, { encoding: "utf8" });
    if (!hash) {
      data = data.replace('export { default as hash } from "./stacks-sip010-hash.json";\n\n', "");
    }
    fs.writeFileSync(`${filePath}.ts`, data);

    console.log("importing stacks sip010 tokens success");
  } catch (err) {
    console.error(err);
  }
};
