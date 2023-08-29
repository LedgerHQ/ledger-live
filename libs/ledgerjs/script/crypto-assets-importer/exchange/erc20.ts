import axios, { AxiosError } from "axios";
import { log } from "console";
import fs from "fs";

type ERC20Exchange = [string, string, string];

const fetchERC20Exchange = async (baseURL: string): Promise<ERC20Exchange[]> => {
  try {
    const { data } = await axios.get<ERC20Exchange[]>(`${baseURL}/exchange/erc20.json`);
    return data;
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
    return [];
  }
};

export const importERC20Exchange = async (baseURL: string, outputDir: string) => {
  log("importing ERC20 exchange...");
  try {
    const erc20Exchange = await fetchERC20Exchange(baseURL);
    fs.writeFileSync(`${outputDir}/exchange/erc20.json`, JSON.stringify(erc20Exchange));

    const erc20typeStringified = `export type ERC20Exchange = [string, string, string];`;
    const tokensStringified = `const exchanges: ERC20Exchange[] = ${JSON.stringify(
      erc20Exchange,
      null,
      2,
    )};`;
    const exportStringified = `export default exchanges;`;

    fs.writeFileSync(
      `${outputDir}/exchange/erc20.ts`,
      `${erc20typeStringified}

${tokensStringified}

${exportStringified}
`,
    );

    log("importing ERC20 exchange success");
  } catch (err) {
    console.error(err);
  }
};
