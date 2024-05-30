import fs from "fs";
import { getEnvs, getFlags, loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { EnvName } from "@ledgerhq/live-env";

let portfolioPage: PortfolioPage;
const environmentFilePath = "artifacts/environment.properties.temp";

const formatFlagsData = (data: { [key in FeatureId]: Feature }) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    allureData += `FF.${key} = ${value.enabled}\n`;

    const entries = {
      desktop_version: value.desktop_version,
      mobile_version: value.mobile_version,
      enabledOverriddenForCurrentVersion: value.enabledOverriddenForCurrentVersion,
      languages_whitelisted: value.languages_whitelisted?.join(", "),
      languages_blacklisted: value.languages_blacklisted?.join(", "),
      enabledOverriddenForCurrentLanguage: value.enabledOverriddenForCurrentLanguage,
      overridesRemote: value.overridesRemote,
      overriddenByEnv: value.overriddenByEnv,
      params: value.params ? JSON.stringify(value.params) : undefined,
    };

    for (const [field, fieldValue] of Object.entries(entries)) {
      if (fieldValue !== undefined) {
        allureData += `FF.${key}.${field} = ${fieldValue
          .toString()
          .replace(/^\{|\}$/g, "")
          .replace(/"/g, " ")}\n`;
      }
    }
  }
  return allureData;
};

const formatEnvData = (data: { [key in EnvName]: string }) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    allureData += `ENV.${key} = ${value}\n`;
  }
  return allureData;
};

describe("Get Feature Flags and Environment Variables", () => {
  beforeAll(async () => {
    portfolioPage = new PortfolioPage();
    await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("write in Allure environment file", async () => {
    const featureFlags = await getFlags();
    const appEnvs = await getEnvs();
    const flagsData = featureFlags ? formatFlagsData(JSON.parse(featureFlags)) : "";
    const envsData = appEnvs ? formatEnvData(JSON.parse(appEnvs)) : "";
    allure.attachment("Feature Flags", featureFlags, "application/json");
    allure.attachment("Environment Variables", appEnvs, "application/json");
    fs.writeFile(environmentFilePath, flagsData + envsData, (err: NodeJS.ErrnoException | null) => {
      if (err) throw err;
    });
  });
});
