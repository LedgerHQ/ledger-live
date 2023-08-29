import axios, { AxiosError } from "axios";
import { log } from "console";
import fs from "fs";
import path from "path";

type EIP712 = {
  [key: string]: {
    label: string;
    signature: string;
    fields: { label: string; path: string; signature: string }[];
  };
};

const writeFiles = (outputDir: string, content: string) => {
  const filePath = path.join(outputDir, "eip712");
  const tsContent = `export default ${content};`;
  fs.writeFileSync(`${filePath}.json`, content, "utf-8");
  fs.writeFileSync(`${filePath}.ts`, tsContent, "utf-8");
};

export const importEIP712 = async (baseURL: string, outputDir: string) => {
  log("importing ERC712 tokens....");
  try {
    const { data } = await axios.get<EIP712>(`${baseURL}/eip712.json`);
    writeFiles(outputDir, JSON.stringify(data));
    log("importing ERC712 tokens sucess");
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
  }
};
