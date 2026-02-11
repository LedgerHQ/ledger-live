import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Flex } from "@ledgerhq/react-ui/index";
import { CryptoAssetsListDevToolContentProps } from "./types";
import { setDrawer } from "~/renderer/drawers/Provider";
import { TokenListDrawer } from "./components/TokenListDrawer";
import DeveloperExpandableRow from "../../components/DeveloperExpandableRow";

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
  const location = useLocation();
  const locationState = location.state as { shouldOpenFeatureFlags?: boolean } | null;

  useEffect(
    () => setContentExpanded(Boolean(locationState?.shouldOpenFeatureFlags)),
    [locationState?.shouldOpenFeatureFlags],
  );

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(!contentExpanded);
  }, [contentExpanded]);

  return (
    <DeveloperExpandableRow
      title={t("settings.developer.cryptoAssetsList.title")}
      desc={<CryptoAssetsListDevToolContent expanded={contentExpanded} />}
      expanded={contentExpanded}
      onToggle={toggleContentVisibility}
      childrenAlignSelf="flex-start"
    />
  );
};

export default CryptoAssetsListDevTool;
