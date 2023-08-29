import axios from "axios";
import { log } from "console";
import fs from "fs";

type BEP20Exchange = [string, string, string];

const fetchBEP20Exchange = async (baseURL: string): Promise<BEP20Exchange[]> => {
  const { data } = await axios.get<BEP20Exchange[]>(`${baseURL}/exchange/bep20.json`);
  return data;
};

export const importBEP20Exchange = async (baseURL: string, outputDir: string) => {
  log("importing bep 20 exchange tokens...");
  const bep20Exchange = await fetchBEP20Exchange(baseURL);
  fs.writeFileSync(`${outputDir}/exchange/bep20.json`, JSON.stringify(bep20Exchange));
  const bep20ExchangeTypeStringified = `export type BEP20Exchange = [string, string, string];`;

  const tokensStringified = `const tokens = ${JSON.stringify(bep20Exchange, null, 2)}`;
  const exportstringified = `export default tokens;`;

  const tsFile = `${bep20ExchangeTypeStringified}

${tokensStringified}

${exportstringified}
`;

  fs.writeFileSync(`${outputDir}/exchange/bep20.ts`, tsFile);
  log("importing bep 20 exchange tokens success");
};
