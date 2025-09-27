import { useState, useMemo } from "react";
import { DEFAULT_CONFIG, LIVE_APPS, LOCATIONS } from "./constants";
import {
  LocationOption,
  AssetsLeftSelectOption,
  AssetsRightSelectOption,
  NetworksLeftSelectOption,
  NetworksRightSelectOption,
  LiveAppOption,
} from "./types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export const useDrawerConfiguration = () => {
  const [assetsLeftElement, setAssetsLeftElement] = useState<AssetsLeftSelectOption>(
    DEFAULT_CONFIG.assetsLeft,
  );
  const [assetsRightElement, setAssetsRightElement] = useState<AssetsRightSelectOption>(
    DEFAULT_CONFIG.assetsRight,
  );
  const [networksLeftElement, setNetworksLeftElement] = useState<NetworksLeftSelectOption>(
    DEFAULT_CONFIG.networksLeft,
  );
  const [networksRightElement, setNetworksRightElement] = useState<NetworksRightSelectOption>(
    DEFAULT_CONFIG.networksRight,
  );

  const drawerConfiguration: EnhancedModularDrawerConfiguration = useMemo(
    () => ({
      assets: {
        leftElement: assetsLeftElement.value,
        rightElement: assetsRightElement.value,
      },
      networks: {
        leftElement: networksLeftElement.value,
        rightElement: networksRightElement.value,
      },
    }),
    [assetsLeftElement, assetsRightElement, networksLeftElement, networksRightElement],
  );

  return {
    assetsLeftElement,
    setAssetsLeftElement,
    assetsRightElement,
    setAssetsRightElement,
    networksLeftElement,
    setNetworksLeftElement,
    networksRightElement,
    setNetworksRightElement,
    drawerConfiguration,
  };
};

export const useDevToolState = () => {
  const [openModal, setOpenModal] = useState(false);
  const [location, setLocation] = useState<LocationOption>(LOCATIONS[0]);
  const [liveApp, setLiveApp] = useState<LiveAppOption>(LIVE_APPS[0]);

  return {
    openModal,
    setOpenModal,
    location,
    setLocation,
    liveApp,
    setLiveApp,
  };
};
