import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import {
  assetsLeftElementOptions,
  assetsRightElementOptions,
  networksLeftElementOptions,
  networksRightElementOptions,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export interface SelectOption {
  value: string;
  label: string;
}

export interface AssetsLeftSelectOption extends SelectOption {
  value: (typeof assetsLeftElementOptions)[number];
}

export interface AssetsRightSelectOption extends SelectOption {
  value: (typeof assetsRightElementOptions)[number];
}

export interface NetworksLeftSelectOption extends SelectOption {
  value: (typeof networksLeftElementOptions)[number];
}

export interface NetworksRightSelectOption extends SelectOption {
  value: (typeof networksRightElementOptions)[number];
}

export interface LocationOption {
  value: ModularDrawerLocation;
  label: string;
}

export interface LiveAppOption {
  value: string;
  label: string;
}

export interface DrawerConfigurationProps {
  assetsLeftElement: AssetsLeftSelectOption;
  setAssetsLeftElement: (option: AssetsLeftSelectOption) => void;
  assetsRightElement: AssetsRightSelectOption;
  setAssetsRightElement: (option: AssetsRightSelectOption) => void;
  networksLeftElement: NetworksLeftSelectOption;
  setNetworksLeftElement: (option: NetworksLeftSelectOption) => void;
  networksRightElement: NetworksRightSelectOption;
  setNetworksRightElement: (option: NetworksRightSelectOption) => void;
}

export interface ModularDrawerDevToolContentProps {
  expanded?: boolean;
}
