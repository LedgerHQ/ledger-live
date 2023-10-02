import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type EIP712 = {
  [key: string]: {
    label: string;
    signature: string;
    fields: { label: string; path: string; signature: string }[];
  };
};

export const importEIP712 = async (outputDir: string) => {
  console.log("importing ERC712 tokens....");
  try {
    const eip712 = await fetchTokens<EIP712>("eip712.json");
    if (eip712) {
      const filePath = path.join(outputDir, "eip712");
      const tsContent = `export default ${JSON.stringify(eip712, null, 2)};`;
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(eip712));
      fs.writeFileSync(`${filePath}.ts`, tsContent);
      console.log("importing ERC712 tokens sucess");
    }
  } catch (err) {
    console.error(err);
  }
};
