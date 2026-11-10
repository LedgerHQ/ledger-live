import React from "react";
import { render, screen } from "tests/testSetup";
import DevToolsScreen from "../screens/DevToolsScreen";

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));
jest.mock("@devtools/transport-panel", () => ({
  TransportPanel: () => null,
}));

const devToolsSpy = jest.fn();
const mockRecordedAction = jest.fn();
jest.mock("@devtools/shell", () => ({
  DevTools: (props: { config: unknown; onClose: () => void }) => {
    devToolsSpy(props);
    return (
      <button type="button" onClick={props.onClose}>
        close-devtools
      </button>
    );
  },
}));

jest.mock("@devtools/bindings", () => ({
  useFeatureFlagsToolProps: () => ({ marker: "ff-props" }),
  usePayCardToolProps: () => ({ marker: "pay-card-props" }),
  useEnvDevToolProps: () => ({ marker: "env-props" }),
  useProdToggle: () => ({
    useProd: false,
    setUseProd: jest.fn(),
    trustchainApiBaseUrl: "http://trustchain.test",
    cloudSyncApiBaseUrl: "http://cloud-sync.test",
  }),
  useTrustchainDevToolProps: () => ({ marker: "trustchain-props" }),
  useCloudSyncDevToolProps: () => ({ marker: "cloud-sync-props" }),
  useAccountDescriptorToolProps: () => ({ marker: "account-descriptor-props" }),
  useAccountBalanceToolProps: () => ({ marker: "account-balance-props" }),
  useAccountOperationToolProps: () => ({ marker: "account-operation-props" }),
  useAccountBalanceHistoryToolProps: () => ({ marker: "account-balance-history-props" }),
  useAccountPortfolioToolProps: () => ({ marker: "account-portfolio-props" }),
  useAccountDataToolProps: () => ({ marker: "account-data-props" }),
  useAccountSourcePortfolioToolProps: () => ({ marker: "account-source-portfolio-props" }),
  useAccountNameToolProps: () => ({ marker: "account-name-props" }),
  useMockAccountsToolProps: () => ({ marker: "mock-accounts-props" }),
  useAccountDetailToolProps: () => ({ marker: "account-detail-props" }),
  useReceiveToolProps: () => ({ marker: "receive-props" }),
  usePredictionsToolProps: () => ({ marker: "predictions-props" }),
  createAccountDataRecorder: () => ({
    instrument: (sources: unknown) => sources,
    middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => {
      mockRecordedAction(action);
      return next(action);
    },
  }),
  useAppConfigToolProps: () => ({ marker: "app-config-props" }),
  useCoinConfigToolProps: () => ({ marker: "coin-config-props" }),
}));

jest.mock("../DeviceOnboarding/useDeviceOnboardingTool", () => ({
  useDeviceOnboardingTool: () => ({ marker: "device-onboarding-props" }),
}));

jest.mock("../IntentWalletSync/useIntentWalletSyncTool", () => ({
  useIntentWalletSyncTool: () => ({
    toolProps: { marker: "intent-wallet-sync-props" },
    run: null,
    onRunCancelled: jest.fn(),
  }),
}));

jest.mock("@devtools/wire", () => {
  const wireState = { hubUrl: "ws://127.0.0.1:9090", role: "host" };
  return {
    buildTransport: () => ({
      transport: {},
      subscribe: () => () => {},
      getState: () => wireState,
      setHubUrl: jest.fn(),
    }),
    buildCopyStoreProtocol: () => ({}),
    combineProtocols: (...args: unknown[]) => args[0],
  };
});

describe("DevToolsScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    devToolsSpy.mockClear();
  });

  it("mounts the DevTools shell with feature-flags and pay-card tool configs", () => {
    render(<DevToolsScreen />);

    expect(devToolsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        config: [
          { id: "feature-flags", config: { marker: "ff-props" } },
          { id: "env", config: { marker: "env-props" } },
          { id: "app-config", config: { marker: "app-config-props" } },
          { id: "coin-config", config: { marker: "coin-config-props" } },
          { id: "pay-card", config: { marker: "pay-card-props" } },
          { id: "trustchain", config: { marker: "trustchain-props" } },
          { id: "cloud-sync", config: { marker: "cloud-sync-props" } },
          { id: "device-onboarding", config: { marker: "device-onboarding-props" } },
          { id: "account-data", config: { marker: "account-data-props" } },
          {
            id: "account-source-portfolio",
            config: { marker: "account-source-portfolio-props" },
          },
          { id: "account-descriptor", config: { marker: "account-descriptor-props" } },
          { id: "account-balance", config: { marker: "account-balance-props" } },
          { id: "account-operation", config: { marker: "account-operation-props" } },
          { id: "account-balance-history", config: { marker: "account-balance-history-props" } },
          { id: "account-name", config: { marker: "account-name-props" } },
          { id: "account-portfolio", config: { marker: "account-portfolio-props" } },
          { id: "mock-accounts", config: { marker: "mock-accounts-props" } },
          { id: "account-detail", config: { marker: "account-detail-props" } },
          { id: "receive", config: { marker: "receive-props" } },
          { id: "predictions", config: { marker: "predictions-props" } },
          { id: "intent-wallet-sync", config: { marker: "intent-wallet-sync-props" } },
        ],
      }),
    );
  });

  it("plugs the account data recorder into the store when it opens", () => {
    const { store } = render(<DevToolsScreen />);

    store.dispatch({ type: "DEVTOOLS_TEST_ACTION" });

    expect(mockRecordedAction).toHaveBeenCalledWith({ type: "DEVTOOLS_TEST_ACTION" });
  });

  it("navigates back when DevTools requests close", async () => {
    const { user } = render(<DevToolsScreen />);

    await user.click(screen.getByText("close-devtools"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("uses the provided onClose instead of navigating back", async () => {
    const onClose = jest.fn();
    const { user } = render(<DevToolsScreen onClose={onClose} />);

    await user.click(screen.getByText("close-devtools"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
