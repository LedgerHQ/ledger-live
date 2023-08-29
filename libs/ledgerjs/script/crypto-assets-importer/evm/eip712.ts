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
  const filePath = path.join(outputDir, "eip712.json");
  const tsContent = `export default ${content};`;
  fs.writeFileSync(`${filePath}.ts`, tsContent, "utf-8");
};

export const importEIP712 = async (baseURL: string, outputDir: string) => {
  try {
    const { data } = await axios.get<EIP712>(`${baseURL}/eip712.json`);
    writeFiles(outputDir, JSON.stringify(data));
    return data;
  } catch (err) {
    const error = err as AxiosError;
    console.error(error.message);
  }
};
