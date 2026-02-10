import { Feature } from "@ledgerhq/types-live";
import { WalletFeatureParamKey } from "./constants";

export type WalletFeatureParams = Partial<Record<WalletFeatureParamKey, boolean>>;

export interface WalletFeaturesDevToolContentProps {
  readonly expanded: boolean;
}

export interface WalletFeaturesViewModel {
  readonly featureFlag: Feature | null;
  readonly isEnabled: boolean;
  readonly params: WalletFeatureParams;
  readonly allEnabled: boolean;
  readonly hasSeenWalletV4Tour: boolean;
  readonly handleToggleAll: (enable: boolean) => void;
  readonly handleToggleEnabled: () => void;
  readonly handleToggleParam: (key: WalletFeatureParamKey) => void;
  readonly handleToggleHasSeenTour: () => void;
}

export interface FeatureParamRowProps {
  readonly paramKey: WalletFeatureParamKey;
  readonly label: string;
  readonly isEnabled: boolean;
  readonly isSelected: boolean;
  readonly onToggle: () => void;
}

export interface QuickActionsProps {
  readonly allEnabled: boolean;
  readonly isEnabled: boolean;
  readonly onEnableAll: () => void;
  readonly onDisableAll: () => void;
}

export interface FeatureFlagPreviewProps {
  readonly featureFlag: Feature | null;
}

export interface MainFeatureToggleProps {
  readonly isEnabled: boolean;
  readonly onToggle: () => void;
}
