import { promises as fs } from "fs";
const detoxGlobalTeardown = require("detox/runners/jest/globalTeardown");

const environmentTempFilePath = "artifacts/environment.properties.temp";
const environmentFilePath = "artifacts/environment.properties";

export default async () => {
  await fs
    .readFile(environmentTempFilePath, "utf8")
    .then(data => {
      return fs.appendFile(environmentFilePath, data);
    })
    .then(() => {
      return fs.unlink(environmentTempFilePath);
    })
    .catch(error => {
      console.error("Error writting final allure environment:", error);
    });
  await detoxGlobalTeardown();
};
