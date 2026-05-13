import type {
  DeviceSessionState,
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
  InternalApi,
  UnknownDAError as UnknownDAErrorType,
} from "@ledgerhq/device-management-kit";
import { UserInteractionRequired } from "@ledgerhq/device-management-kit";
import type { Observer } from "rxjs";
import type { ConnectAppDeviceAction } from "../ConnectApp/ConnectAppDeviceAction";
import type { ConnectAppDAState } from "../ConnectApp/types";
import type { ConnectAppDASnapshotHandler } from "./ConnectAppEventHandler";
import type { EnsureAppReadyState } from "./state";

export type { ConnectAppDASnapshotHandler } from "./ConnectAppEventHandler";

export type StateEmitter = Pick<Observer<EnsureAppReadyState>, "next">;

export type ConnectAppDeviceActionExecutor = Pick<ConnectAppDeviceAction, "_execute">;

export type DeprecationPresentationInput = {
  flow: string;
  currencyName: string;
};

export type EnsureAppReadyDAInput = {
  appName: string;
  deprecation?: DeprecationPresentationInput;
  deprecationDismissedCurrencyNames: string[];
  connectAppDeviceAction: ConnectAppDeviceActionExecutor;
  observer: StateEmitter;
  retry: () => void;
  additionalSnapshotHandlers: ConnectAppDASnapshotHandler[];
};

export type EnsureAppReadyDAOutput = undefined;

export type EnsureAppReadyDAIntermediateValue = {
  requiredUserInteraction: UserInteractionRequired.None;
};

export type EnsureAppReadyDAError = UnknownDAErrorType;

export type EnsureAppReadyInternalState = {
  readonly latestConnectAppState: ConnectAppDAState | null;
  readonly deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  readonly derivation: string | undefined;
  readonly currentApp: GetAppAndVersionResponse | undefined;
  readonly unexpectedError: EnsureAppReadyDAError | null;
};

export type EnsureAppReadyDeviceActionDependencies = {
  readonly shouldUpgrade: (appName: string, appVersion: string) => boolean;
  readonly buildFinalState: (params: {
    deviceMetadata: GetDeviceMetadataDAOutput | undefined;
    currentApp: GetAppAndVersionResponse;
    derivation: string | undefined;
  }) => EnsureAppReadyState;
};

export type EnsureAppReadyMachineDependencies = {
  readonly getCurrentDeviceState: () => DeviceSessionState;
};

type LoggerFactory = NonNullable<InternalApi["loggerFactory"]>;
type LoggerPublisher = ReturnType<LoggerFactory>;

export type EnsureAppReadyDeviceActionConstructorArgs = {
  input: EnsureAppReadyDAInput;
  inspect?: boolean;
  logger?: LoggerPublisher;
  loggerFactory?: LoggerFactory;
  dependencies: EnsureAppReadyDeviceActionDependencies;
};
