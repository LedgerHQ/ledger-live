export { DefaultDeviceDiscoveryService } from "./deviceConnectivity/discoveryService/DefaultDeviceDiscoveryService";
export {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectivityUIStateTypes,
} from "./deviceConnectivity/types";
export type {
  BaseConnectionError,
  BaseDiscoveryError,
  ConnectionErrorUIState,
  Device,
  DeviceConnectionResult,
  DeviceDiscoveryService,
  DeviceDiscoveryStartArgs,
  DiscoveryErrorResolution,
  DiscoveryErrorUIState,
  UnknownConnectionError,
  UnknownDiscoveryError,
  UnknownErrorUIState,
} from "./deviceConnectivity/types";
export type {
  DeviceDiscoverySource,
  DeviceDiscoverySourceEvent,
} from "./deviceConnectivity/discoveryService/sources/DeviceDiscoverySource";
export * from "./deviceConnectivity/discoveryService/sources/listenToTransportDevices";
export * from "./transport/SpeculosTransportSession";
export { ConnectDeviceUIStateTypes } from "./connectDevice/types";
export type {
  ConnectDeviceMapConnectionError,
  ConnectDeviceMatchDiscoveredDevices,
  ConnectDeviceUIState,
  ConnectDeviceUIStateType,
  DisplayedDevice,
  KnownDevice,
  MatchedDevice,
} from "./connectDevice/types";
export {
  connectDeviceUseCase,
  type ConnectDeviceUseCaseInput,
} from "./connectDevice/connectDeviceUseCase";
export { ConnectNewDeviceUIStateTypes } from "./connectNewDevice/types";
export type {
  ConnectNewDeviceFilterListedDevices,
  ConnectNewDeviceGetDiscoveredDeviceKey,
  ConnectNewDeviceMapConnectionError,
  ConnectNewDeviceStateMachineInput,
  ConnectNewDeviceUIState,
  ConnectNewDeviceUIStateType,
  ListedDevice,
  SelectableDevice,
} from "./connectNewDevice/types";
export {
  DefaultConnectNewDeviceStateMachine,
  type ConnectNewDeviceStateMachine,
} from "./connectNewDevice/ConnectNewDeviceStateMachine";
export {
  connectNewDeviceUseCase,
  type ConnectNewDeviceUseCaseInput,
} from "./connectNewDevice/connectNewDeviceUseCase";
export { activeDeviceSessionSubject } from "./config/activeDeviceSession";
export { dmkToLedgerDeviceIdMap, ledgerToDmkDeviceIdMap } from "./config/dmkToLedgerDeviceIdMap";
export {
  DeviceIntentTrackingProvider,
  useDeviceIntentTracking,
} from "./deviceIntentTracking/DeviceIntentTrackingContext";
export type {
  DeviceIntentTrackingContextValue,
  DeviceIntentTrackingProperties,
  SourceFlow,
} from "./deviceIntentTracking/DeviceIntentTrackingContext";
export {
  DeviceFlowFailureType,
  getConnectDeviceFailure,
  getConnectDeviceSubError,
  getDeviceDisconnectedFailure,
  getDeviceFlowFailureProperties,
  getDeviceflowCancelEventName,
  getEnsureAppReadyFailure,
  getErrorName,
  getInvalidOperationFailure,
} from "./deviceIntentTracking/deviceFlowFailure";
export type {
  DeviceFlowDevice,
  DeviceFlowFailure,
  DeviceFlowFailureProperties,
  DeviceFlowTransport,
} from "./deviceIntentTracking/deviceFlowFailure";
export { OverrideDeviceIntentExecutorHeader } from "./deviceIntentHeader/OverrideDeviceIntentExecutorHeader";
export { DeviceIntentExecutorHeaderContext } from "./deviceIntentHeader/DeviceIntentExecutorHeaderContext";
export type { DeviceIntentExecutorHeaderContextValue } from "./deviceIntentHeader/DeviceIntentExecutorHeaderContext";
export { useDeviceIntentExecutorHeaderOverrideRequests } from "./deviceIntentHeader/useDeviceIntentExecutorHeaderOverrideRequests";
export { AddressBookProvider } from "./services/AddressBookProvider";
export type { AddressBookSource } from "./services/AddressBookProvider";
export { LedgerLiveLogger } from "./services/LedgerLiveLogger";
export { UserHashService } from "./services/UserHashService";
export { syncFirmwareDistributionSalt } from "./services/syncFirmwareDistributionSalt";
export {
  LiveBlindSigningReporter,
  liveBlindSigningReporter,
  buildDefaultHttpBlindSigningReporter,
} from "./services/LiveBlindSigningReporter";
export type { LiveBlindSigningContext } from "./services/LiveBlindSigningReporter";
export { DmkCompatTransport } from "./transport/DmkCompatTransport";

export { ConnectAppDeviceAction } from "./device-action/ConnectApp/ConnectAppDeviceAction";
export {
  DeviceDeprecationError,
  UserInteractionRequiredLL,
} from "./device-action/ConnectApp/types";
export type {
  ConnectAppDerivation,
  ConnectAppDAOutput,
  ConnectAppDAInput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue,
  ConnectAppDARequiredInteraction,
  ConnectAppDAState,
} from "./device-action/ConnectApp/types";
export { EnsureAppReadyDeviceAction } from "./device-action/EnsureAppReady/EnsureAppReadyDeviceAction";
export { buildExtractedContext } from "./device-action/EnsureAppReady/stateMapping";
export type {
  EnsureAppReadyDAOutput,
  EnsureAppReadyDAInput,
  EnsureAppReadyDAError,
  EnsureAppReadyDAIntermediateValue,
  EnsureAppReadyDeviceActionDependencies,
  ConnectAppDASnapshotHandler,
} from "./device-action/EnsureAppReady/types";
export {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  isRetryableState,
  LoadingStateType,
  RetryableStateType,
} from "./device-action/EnsureAppReady/state";
export type {
  EnsureAppReadyState,
  DeviceExtractedContext,
} from "./device-action/EnsureAppReady/state";
export type {
  DeprecationPresentationDecision,
  DeprecationScreenKind,
} from "./device-action/EnsureAppReady/deprecationPresentationTypes";
export { PrepareConnectManagerDeviceAction } from "./device-action/PrepareConnectManager/PrepareConnectManagerDeviceAction";
export type {
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAInput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue,
} from "./device-action/PrepareConnectManager/types";
export * from "./os-update/api";
