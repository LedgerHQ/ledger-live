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
  console.log("importing EIP712....");
  try {
    const [eip712, hash] = await fetchTokens<EIP712>("eip712.json");
    if (eip712) {
      const filePath = path.join(outputDir, "eip712");
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(eip712));
      if (hash) {
        fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
      }

      const tsContent = `import EIP712 from "./eip712.json";
${hash ? `export { default as hash } from "./eip712-hash.json";` : null}
export default EIP712;
`;
      fs.writeFileSync(`${filePath}.ts`, tsContent);
      console.log("importing EIP712 sucess");
    }
  } catch (err) {
    console.error(err);
  }
};

export const importEIP712v2 = async (outputDir: string) => {
  console.log("importing EIP712 V2....");
  try {
    const [eip712, hash] = await fetchTokens<EIP712>("eip712_v2.json");
    if (eip712) {
      const filePath = path.join(outputDir, "eip712_v2");
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(eip712));
      if (hash) {
        fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
      }

      const tsContent = `import EIP712 from "./eip712_v2.json";
${hash ? `export { default as hash } from "./eip712_v2-hash.json";` : null}
export default EIP712;
`;
      fs.writeFileSync(`${filePath}.ts`, tsContent);
      console.log("importing EIP712 V2 sucess");
    }
  } catch (err) {
    console.error(err);
  }
};
