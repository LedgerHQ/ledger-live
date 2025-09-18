import fsPromises from "fs/promises";

export const getUserdata = async (userdataFile: string) => {
  const jsonFile = await fsPromises.readFile(userdataFile, "utf-8");
  return JSON.parse(jsonFile);
};
