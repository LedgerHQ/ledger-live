import type { DeviceId } from "@ledgerhq/client-ids/ids";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { FlowName } from "../../../device-action/utils";
import type { RequiresDerivation } from "../../../hw/connectApp";
import type { ExpectedAccountIdentity } from "../../../hw/deviceInitialization/helpers/wrongDeviceValidation";

/**
 * Caller-provided context used to decide whether a deprecation screen applies
 * for the current connect-app flow.
 */
export type DeprecationPresentationInput = {
  /** Flow in which connect-app is currently running. */
  flow: FlowName;
  /**
   * User-facing main currency or token name.
   *
   * This value is used for policy exception matching, persisted warning
   * dismissal matching, and deprecation screen copy.
   */
  currencyName: string;
};

export type AppRequestInput = {
  appName?: string;
  currency?: CryptoCurrency | null;
  account?: Account;
  tokenCurrency?: TokenCurrency;
  dependencies?: AppRequestInput[];
  withInlineInstallProgress?: boolean;
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
};

/**
 * Input consumed by `ensureAppReadyUseCase`.
 */
export type EnsureAppReadyInput = {
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
  allowPartialDependencies: boolean;
  requiresDerivation?: RequiresDerivation;
  expectedAccount?: ExpectedAccountIdentity;
  deprecation?: DeprecationPresentationInput;
};

export type ConnectAppInitSideEffects = {
  onDeviceIdObserved: (deviceId: DeviceId) => void;
  onLastSeenDeviceInfoObserved: (params: {
    modelId: DeviceModelId;
    deviceInfo: DeviceInfo;
    latestFirmware: FirmwareUpdateContext | null;
  }) => void;
};
