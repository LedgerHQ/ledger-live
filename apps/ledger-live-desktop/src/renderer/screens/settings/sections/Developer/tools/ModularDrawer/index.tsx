import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Flex } from "@ledgerhq/react-ui/index";
import { useOpenAssetFlow as useOpenAssetFlowDrawer } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation, openAssetAndAccountDrawer } from "LLD/features/ModularDrawer";
import { FeatureFlags } from "./FeatureFlags";
import { DrawerConfiguration } from "./DrawerConfiguration";
import { DevToolControls } from "./DevToolControls";
import { useDrawerConfiguration, useDevToolState } from "./hooks";
import { ModularDrawerDevToolContentProps } from "./types";
import { useDispatch } from "LLD/hooks/redux";
import {
  setIsDebuggingDuplicates,
  setFlowValue,
  setSourceValue,
} from "~/renderer/reducers/modularDrawer";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useOpenAssetFlowDialog } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import DeveloperExpandableRow from "../../components/DeveloperExpandableRow";

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
      title={t("settings.developer.modularDrawerDevTool.title")}
      desc={<ModularDrawerDevToolContent expanded={contentExpanded} />}
      expanded={contentExpanded}
      onToggle={toggleContentVisibility}
      childrenAlignSelf="flex-start"
    />
  );
};

export default ModularDrawerDevTool;
