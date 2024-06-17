import fs from "fs";
import { getEnvs, getFlags } from "../bridge/server";
import { Application } from "../page";
import { formatFlagsData, formatEnvData } from "@ledgerhq/live-common/e2e/index";

let app: Application;

const environmentFilePath = "artifacts/environment.properties.temp";

describe("Get Feature Flags and Environment Variables", () => {
  beforeAll(async () => {
    app = await Application.init("1AccountBTC1AccountETHReadOnlyFalse");
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("write in Allure environment file", async () => {
    const featureFlags = await getFlags();
    const appEnvs = await getEnvs();
    const flagsData = featureFlags ? formatFlagsData(JSON.parse(featureFlags)) : "";
    const envsData = appEnvs ? formatEnvData(JSON.parse(appEnvs)) : "";
    await allure.attachment("Feature Flags", featureFlags, "application/json");
    await allure.attachment("Environment Variables", appEnvs, "application/json");
    fs.writeFileSync(environmentFilePath, flagsData + envsData);
  });
});
