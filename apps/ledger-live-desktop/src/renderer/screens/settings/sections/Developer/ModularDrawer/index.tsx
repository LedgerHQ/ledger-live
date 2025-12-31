import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Flex } from "@ledgerhq/react-ui/index";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { useOpenAssetFlow as useOpenAssetFlowDrawer } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation, openAssetAndAccountDrawer } from "LLD/features/ModularDrawer";
import { FeatureFlags } from "./FeatureFlags";
import { DrawerConfiguration } from "./DrawerConfiguration";
import { DevToolControls } from "./DevToolControls";
import { useDrawerConfiguration, useDevToolState } from "./hooks";
import { ModularDrawerDevToolContentProps } from "./types";
import { useDispatch } from "react-redux";
import {
  setIsDebuggingDuplicates,
  setFlowValue,
  setSourceValue,
} from "~/renderer/reducers/modularDrawer";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useOpenAssetFlowDialog } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";

export const ModularDrawerDevToolContent = (props: ModularDrawerDevToolContentProps) => {
  const { t } = useTranslation();
  const { openModal, setOpenModal, location, setLocation, liveApp, setLiveApp } = useDevToolState();
  const dispatch = useDispatch();

  const {
    assetsLeftElement,
    setAssetsLeftElement,
    assetsRightElement,
    setAssetsRightElement,
    networksLeftElement,
    setNetworksLeftElement,
    networksRightElement,
    setNetworksRightElement,
    drawerConfiguration,
  } = useDrawerConfiguration();

  const { openAssetFlow } = useOpenAssetFlowDrawer(
    location.value === ModularDrawerLocation.LIVE_APP
      ? { location: location.value, liveAppId: liveApp.value }
      : { location: location.value },
    "receive",
    openModal ? "MODAL_RECEIVE" : undefined,
  );

  const { openAssetFlowDialog } = useOpenAssetFlowDialog(
    location.value === ModularDrawerLocation.LIVE_APP
      ? { location: location.value, liveAppId: liveApp.value }
      : { location: location.value },
    "receive",
    openModal ? "MODAL_RECEIVE" : undefined,
  );

  const debugDuplicates = () => {
    dispatch(setIsDebuggingDuplicates(true));
    openAssetFlowDialog({
      assets: { leftElement: "undefined", rightElement: "undefined" },
      networks: { leftElement: "undefined", rightElement: "undefined" },
    });
  };

  const openDrawerFunctions: Record<ModularDrawerLocation, () => void> = {
    [ModularDrawerLocation.ADD_ACCOUNT]: () => openAssetFlow(drawerConfiguration),
    [ModularDrawerLocation.LIVE_APP]: () => {
      dispatch(setFlowValue("Dev Tool"));
      dispatch(setSourceValue("Dev Tool"));
      openAssetAndAccountDrawer({
        drawerConfiguration,
      });
    },
    [ModularDrawerLocation.RECEIVE_FLOW]: () => {},
    [ModularDrawerLocation.SEND_FLOW]: () => {},
  };

  const { openAssetAndAccount } = useOpenAssetAndAccount(true);

  const openDrawerFunctionsDialog: Record<ModularDrawerLocation, () => void> = {
    [ModularDrawerLocation.ADD_ACCOUNT]: () => openAssetFlowDialog(drawerConfiguration),
    [ModularDrawerLocation.LIVE_APP]: () => {
      dispatch(setFlowValue("Dev Tool"));
      dispatch(setSourceValue("Dev Tool"));
      openAssetAndAccount({ drawerConfiguration });
    },
    [ModularDrawerLocation.RECEIVE_FLOW]: () => {},
    [ModularDrawerLocation.SEND_FLOW]: () => {},
  };

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.modularDrawerDevTool.description")}</div>
      {props.expanded && (
        <Flex flexDirection="column" rowGap={4} mt={2}>
          <FeatureFlags />
          <DevToolControls
            location={location}
            setLocation={setLocation}
            liveApp={liveApp}
            setLiveApp={setLiveApp}
            openModal={openModal}
            setOpenModal={setOpenModal}
          />
          <DrawerConfiguration
            assetsLeftElement={assetsLeftElement}
            setAssetsLeftElement={setAssetsLeftElement}
            assetsRightElement={assetsRightElement}
            setAssetsRightElement={setAssetsRightElement}
            networksLeftElement={networksLeftElement}
            setNetworksLeftElement={setNetworksLeftElement}
            networksRightElement={networksRightElement}
            setNetworksRightElement={setNetworksRightElement}
          />
          <Flex columnGap={"12px"}>
            <Button
              appearance="base"
              size="sm"
              onClick={() => openDrawerFunctions[location.value]()}
            >
              {t("settings.developer.modularDrawerDevTool.openDrawer")}
            </Button>
            <Button size="sm" onClick={() => openDrawerFunctionsDialog[location.value]()}>
              {t("settings.developer.modularDrawerDevTool.debugDialog")}
            </Button>
            <Button appearance="accent" size="sm" onClick={debugDuplicates}>
              {t("settings.developer.modularDrawerDevTool.debugDuplicates")}
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

const ModularDrawerDevTool = () => {
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
      title={t("settings.developer.modularDrawerDevTool.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<ModularDrawerDevToolContent expanded={contentExpanded} />}
    >
      <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default ModularDrawerDevTool;
