import axios, { AxiosError } from "axios";
import { log } from "console";
import fs from "fs";

const fetchERC20Signatures = async (baseURL: string): Promise<string> => {
  try {
    const { data } = await axios.get<string>(`${baseURL}/erc20-signatures.json`);
    return data;
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
    return "";
  }
};

export const importERC20Signatures = async (baseURL: string, outputDir: string) => {
  log("importing erc20 signatures...");
  try {
    const erc20Signatures = await fetchERC20Signatures(baseURL);
    fs.writeFileSync(`${outputDir}/erc20-signatures.json`, JSON.stringify(erc20Signatures));
    fs.writeFileSync(
      `${outputDir}/erc20-signatures.ts`,
      `export default ${JSON.stringify(erc20Signatures)};`,
    );
    log("importing erc20 signatures: success");
  } catch (err) {
    console.error(err);
  }
};
