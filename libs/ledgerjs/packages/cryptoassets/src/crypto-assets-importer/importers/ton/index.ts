import fs from "fs";
import path from "path";
import { fetchTokens } from "../../fetch";

type TonJettonToken = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // magntude
  boolean, // delisted
  boolean, // enableCountervalues
];

export const importTonJettonTokens = async (outputDir: string) => {
  try {
    console.log("importing ton jetton tokens...");
    const [jettontokens, hash] = await fetchTokens<TonJettonToken[]>("jetton.json");
    const filePath = path.join(outputDir, "ton-jetton");
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(jettontokens));
    if (hash) {
      fs.writeFileSync(`${filePath}-hash.json`, JSON.stringify(hash));
    }

    fs.writeFileSync(
      `${filePath}.ts`,
      `export type TonJettonToken = [
  string, // contractAddress
  string, // name
  string, // ticker
  number, // magntude
  boolean, // delisted
  boolean, // enableCountervalues
];

import tokens from "./ton-jetton.json";

${hash ? `export { default as hash } from "./ton-jetton-hash.json";` : ""}

export default tokens as TonJettonToken[];
`,
    );

    console.log("importing ton jetton tokens success");
  } catch (err) {
    console.error(err);
  }
};
