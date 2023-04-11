import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Switch, Route } from "react-router-dom";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import AllowExperimentalAppsToggle from "./AllowExperimentalAppsToggle";
import AllowDebugAppsToggle from "./AllowDebugAppsToggle";
import EnablePlatformDevToolsToggle from "./EnablePlatformDevToolsToggle";
import CatalogProviderInput from "./CatalogProviderInput";
import CustomLockScreenToggle from "./CustomLockScreenToggle";
import CustomLockScreen from "./CustomLockScreen";
import CatalogRampProviderSelect from "./CatalogRampProviderSelect";
import RunLocalAppButton from "./RunLocalAppButton";
import FeatureFlagsSettings from "./FeatureFlagsSettings";
import EnableLearnPageStagingUrlToggle from "./EnableLearnPageStagingUrlToggle";
import OnboardingAppInstallDebugButton from "./OnboardingAppInstallDebug";
import EnableStagingNftMetadataServiceToggle from "./EnableStagingNftMetadataServiceToggle";
import { addTokens, getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies";
import { Button } from "@ledgerhq/react-ui";

function convertERC20([
  parentCurrencyId,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress,
  disableCountervalue,
  delisted,
  countervalueTicker,
]: any): any {
  const parentCurrency = getCryptoCurrencyById(parentCurrencyId);
  return {
    type: "TokenCurrency",
    id: parentCurrencyId + "/erc20/" + token,
    ledgerSignature,
    contractAddress,
    parentCurrency,
    tokenType: "erc20",
    name,
    ticker,
    delisted,
    disableCountervalue: !!parentCurrency.isTestnetFor || !!disableCountervalue,
    countervalueTicker,
    units: [
      {
        name,
        code: ticker,
        magnitude,
      },
    ],
  };
}

const Default = () => {
  const { t } = useTranslation();
  const test = useCallback(() => {
    addTokens(
      [
        [
          "ethereum",
          "kiba_inu",
          "KIBA",
          18,
          "Kiba Inu",
          "3045022100baa979e8461d439b324416dff31f277663b51fa36e5e60005933292d5151f32502200528872863ce6b55009387bd2c5b6556b907193e27f506236149634a97518822",
          "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
          true,
          true,
        ],
        ,
      ].map(convertERC20),
    );
  }, [addTokens, convertERC20]);
  return (
    <Body>
      <Row title={t("settings.developer.debugApps")} desc={t("settings.developer.debugAppsDesc")}>
        <AllowDebugAppsToggle />
      </Row>

      <Row
        title={t("settings.developer.experimentalApps")}
        desc={t("settings.developer.experimentalAppsDesc")}
      >
        <AllowExperimentalAppsToggle />
      </Row>

      <Row title={t("settings.developer.catalogUrl")} desc={t("settings.developer.catalogUrlDesc")}>
        <CatalogProviderInput />
      </Row>

      <Row
        title={t("settings.developer.catalogRampServer")}
        desc={t("settings.developer.catalogRampServerDesc")}
      >
        <CatalogRampProviderSelect />
      </Row>
      <Row
        title={t("settings.developer.enablePlatformDevTools")}
        desc={t("settings.developer.enablePlatformDevToolsDesc")}
      >
        <EnablePlatformDevToolsToggle />
      </Row>
      <RunLocalAppButton />
      <CustomLockScreenToggle />
      <FeatureFlagsSettings />
      <Row
        title={t("settings.developer.enableLearnStagingUrl")}
        desc={t("settings.developer.enableLearnStagingUrlDesc")}
      >
        <EnableLearnPageStagingUrlToggle />
      </Row>
      <Row
        title={t("settings.developer.enableStagingNftMetadataService")}
        desc={t("settings.developer.enableStagingNftMetadataServiceDesc")}
      >
        <EnableStagingNftMetadataServiceToggle />
      </Row>
      <Row
        title={t("settings.developer.openOnboardingAppInstallDebug")}
        desc={t("settings.developer.openOnboardingAppInstallDebugDesc")}
      >
        <OnboardingAppInstallDebugButton />
      </Row>
      <Row title={"delist specific token"} desc={"addToken test"}>
        <Button onClick={() => test()}>Bonjour</Button>
      </Row>
    </Body>
  );
};
const SectionDeveloper = () => (
  <>
    <TrackPage category="Settings" name="Developer" />
    <Switch>
      <Route path="/settings/developer/custom-locksscreen-assets" component={CustomLockScreen} />
      <Route component={Default} />
    </Switch>
  </>
);
export default SectionDeveloper;
