import axios, { AxiosError } from "axios";
import { log } from "console";
import fs from "fs";

export type BEP20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter value
  boolean, // delisted
  string?, // legacy
];

const fetchBEP20 = async (baseURL: string): Promise<BEP20Token[]> => {
  try {
    const { data } = await axios.get<BEP20Token[]>(`${baseURL}/bep20.json`);
    return data;
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
    return [];
  }
};

export const importBEP20 = async (baseURL: string, outputDir: string) => {
  try {
    log("import BEP 20 tokens...");
    const bep20 = await fetchBEP20(baseURL);

    // TODO: we could decide to add so validators to remove duplicates, tokens that are not valid
    // the json file in the CDN should always be valid and checked so we need to decide if we want to double check here

    fs.writeFileSync(`${outputDir}/bep20.json`, JSON.stringify(bep20));

    const BEP20TokenTypeStringified = `export type BEP20Token = [
  string, // parent currency id
  string, // token
  string, // ticker
  number, // precision
  string, // name
  string, // ledgerSignature
  string, // contract address
  boolean, // disabled counter value
  boolean, // delisted
  string?, // legacy
  string?, // legacy
];`;

    const tokensStringified = `const tokens: BEP20Token[] = ${JSON.stringify(bep20, null, 2)};`;
    const exportStringified = `export default tokens;`;

    fs.writeFileSync(
      `${outputDir}/bep20.ts`,
      `${BEP20TokenTypeStringified}

${tokensStringified}
            
${exportStringified}
`,
    );

    log("import BEP 20 tokens success");
  } catch (err) {
    console.error(err);
  }
};
