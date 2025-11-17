import { readFile } from "fs/promises";

export const getUserdata = async (userdataFile: string) => {
  const jsonFile = await readFile(userdataFile, "utf-8");
  return JSON.parse(jsonFile);
};
