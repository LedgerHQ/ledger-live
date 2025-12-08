import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@ledgerhq/ldls-ui-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Flex } from "@ledgerhq/react-ui/index";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { CryptoAssetsListDevToolContentProps } from "./types";
import { setDrawer } from "~/renderer/drawers/Provider";
import { TokenListDrawer } from "./components/TokenListDrawer";

export const CryptoAssetsListDevToolContent = (props: CryptoAssetsListDevToolContentProps) => {
  const { t } = useTranslation();

  const openTokenListDrawer = useCallback(() => {
    setDrawer(TokenListDrawer, {
      initialFamily: "ethereum",
    });
  }, []);

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.cryptoAssetsList.description")}</div>
      {props.expanded && (
        <Flex flexDirection="column" rowGap={4} mt={2}>
          <Flex columnGap={"12px"}>
            <Button size="sm" appearance="accent" onClick={openTokenListDrawer}>
              {t("settings.developer.cryptoAssetsList.openTokenList")}
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

const CryptoAssetsListDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);
  const location = useLocation<{ shouldOpenFeatureFlags?: boolean }>();

  useEffect(
    () => setContentExpanded(Boolean(location.state?.shouldOpenFeatureFlags)),
    [location.state?.shouldOpenFeatureFlags],
  );

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(!contentExpanded);
  }, [contentExpanded]);

  return (
    <Row
      title={t("settings.developer.cryptoAssetsList.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<CryptoAssetsListDevToolContent expanded={contentExpanded} />}
    >
      <Button size="sm" appearance="accent" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default CryptoAssetsListDevTool;
