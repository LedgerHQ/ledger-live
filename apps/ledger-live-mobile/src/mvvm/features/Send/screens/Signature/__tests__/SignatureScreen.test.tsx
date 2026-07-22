import React from "react";
import { Observable } from "rxjs";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignTransactionIntent } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useFeature } from "@features/platform-feature-flags";
import { render, screen } from "@tests/test-renderer";
import { SignatureScreen } from "../index";
import * as UseSignatureViewModelModule from "../hooks/useSignatureViewModel";
import * as UseSignatureDeviceActionViewModelModule from "../hooks/useSignatureDeviceActionViewModel";
import { createBitcoinTransaction } from "../../CoinControl/hooks/__tests__/helpers";
import { createMockAccount } from "../../Recipient/hooks/__tests__/accounts";

type SignatureViewModel = ReturnType<typeof UseSignatureViewModelModule.useSignatureViewModel>;
type SignatureDeviceActionViewModel = ReturnType<
  typeof UseSignatureDeviceActionViewModelModule.useSignatureDeviceActionViewModel
>;

const mockAccount = createMockAccount({ id: "account-1" });
const mockParentAccount = createMockAccount({ id: "account-0" });
const mockTransaction = createBitcoinTransaction();
const mockRequest: SignatureRequest = {
  account: mockAccount,
  parentAccount: null,
  transaction: mockTransaction,
};
const mockDeviceInitializationInput = {
  appName: "Bitcoin",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
} satisfies InitializationInput;
const mockSignatureIntent = {
  uuid: "signature-intent",
  label: "Sign transaction",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: () => new Observable(),
  component: () => null,
  input: mockRequest,
} satisfies SignTransactionIntent;

const mockDeviceIntentExecutorLWM = jest.fn();
const mockSignatureDeviceActionView = jest.fn();

jest.mock("@ledgerhq/live-common/firebase/featureFlags", () => ({
  getFeature: jest.fn(),
}));

jest.mock("@features/platform-feature-flags", () => ({
  formatToFirebaseFeatureId: (featureId: string) => featureId,
  useFeature: jest.fn(),
  useFeatureFlags: jest.fn(() => ({})),
}));

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  __esModule: true,
  DeviceIntentExecutorLWM: (props: unknown) => {
    mockDeviceIntentExecutorLWM(props);
    return null;
  },
}));

jest.mock("../hooks/useSignatureViewModel", () => ({
  useSignatureViewModel: jest.fn(),
}));

jest.mock("../hooks/useSignatureDeviceActionViewModel", () => ({
  useSignatureDeviceActionViewModel: jest.fn(),
}));

jest.mock("../components/SignatureDeviceActionView", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SignatureDeviceActionView: (props: unknown) => {
      mockSignatureDeviceActionView(props);
      return React.createElement(View, { testID: "send-signature-device-action-step" });
    },
  };
});

function buildViewModel(overrides: Partial<SignatureViewModel> = {}): SignatureViewModel {
  return {
    account: mockAccount,
    parentAccount: mockParentAccount,
    transaction: mockTransaction,
    request: mockRequest,
    deviceInitializationInput: mockDeviceInitializationInput,
    signatureIntent: mockSignatureIntent,
    isSigningCompleted: false,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobError: jest.fn(),
    onUserCancel: jest.fn(),
    ...overrides,
  };
}

function buildDeviceActionViewModel(
  overrides: Partial<SignatureDeviceActionViewModel> = {},
): SignatureDeviceActionViewModel {
  return {
    account: mockAccount,
    parentAccount: mockParentAccount,
    transaction: mockTransaction,
    request: mockRequest,
    action: {
      useHook: jest.fn(),
      mapResult: jest.fn(),
    } as unknown as SignatureDeviceActionViewModel["action"],
    selectedDevice: null,
    setSelectedDevice: jest.fn(),
    onDeviceActionResultCompleted: jest.fn(),
    onUserCancel: jest.fn(),
    ...overrides,
  };
}

describe("SignatureScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFeature).mockReturnValue({ enabled: false });
    jest
      .mocked(UseSignatureViewModelModule.useSignatureViewModel)
      .mockReturnValue(buildViewModel());
    jest
      .mocked(UseSignatureDeviceActionViewModelModule.useSignatureDeviceActionViewModel)
      .mockReturnValue(buildDeviceActionViewModel());
  });

  describe("when required flow data is missing", () => {
    it("should render nothing when account is missing", () => {
      jest
        .mocked(UseSignatureViewModelModule.useSignatureViewModel)
        .mockReturnValue(buildViewModel({ account: null }));
      render(<SignatureScreen />);
      expect(screen.queryByTestId("send-signature-step")).toBeNull();
    });

    it("should render nothing when transaction is missing", () => {
      jest
        .mocked(UseSignatureViewModelModule.useSignatureViewModel)
        .mockReturnValue(buildViewModel({ transaction: null }));
      render(<SignatureScreen />);
      expect(screen.queryByTestId("send-signature-step")).toBeNull();
    });

    it("should render nothing when device initialization input is missing", () => {
      jest
        .mocked(UseSignatureViewModelModule.useSignatureViewModel)
        .mockReturnValue(buildViewModel({ deviceInitializationInput: null }));
      render(<SignatureScreen />);
      expect(screen.queryByTestId("send-signature-step")).toBeNull();
    });

    it("should render nothing when signature intent is missing", () => {
      jest
        .mocked(UseSignatureViewModelModule.useSignatureViewModel)
        .mockReturnValue(buildViewModel({ signatureIntent: null }));
      render(<SignatureScreen />);
      expect(screen.queryByTestId("send-signature-step")).toBeNull();
    });
  });

  it("should render DeviceIntentExecutorLWM when useDeviceActionSignatureSend is disabled", () => {
    const viewModel = buildViewModel();
    jest.mocked(UseSignatureViewModelModule.useSignatureViewModel).mockReturnValue(viewModel);

    render(<SignatureScreen />);

    expect(useFeature).toHaveBeenCalledWith("useDeviceActionSignatureSend");
    expect(screen.getByTestId("send-signature-step")).toBeOnTheScreen();
    expect(mockSignatureDeviceActionView).not.toHaveBeenCalled();
    expect(mockDeviceIntentExecutorLWM).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        sourceFlow: "send",
        deviceConnectionParams: { acceptedDeviceModelIds: [] },
        deviceInitializationInput: viewModel.deviceInitializationInput,
        intent: viewModel.signatureIntent,
        intentComponentExtraProps: undefined,
        onIntentJobStateChanged: viewModel.onIntentJobStateChanged,
        onIntentJobError: viewModel.onIntentJobError,
        onUserCancel: viewModel.onUserCancel,
      }),
    );
  });

  it("should render DeviceAction screen when useDeviceActionSignatureSend is enabled", () => {
    const viewModel = buildDeviceActionViewModel();
    jest.mocked(useFeature).mockReturnValue({ enabled: true });
    jest
      .mocked(UseSignatureDeviceActionViewModelModule.useSignatureDeviceActionViewModel)
      .mockReturnValue(viewModel);

    render(<SignatureScreen />);

    expect(useFeature).toHaveBeenCalledWith("useDeviceActionSignatureSend");
    expect(screen.getByTestId("send-signature-device-action-step")).toBeOnTheScreen();
    expect(mockDeviceIntentExecutorLWM).not.toHaveBeenCalled();
    expect(mockSignatureDeviceActionView).toHaveBeenCalledWith(
      expect.objectContaining({
        account: viewModel.account,
        parentAccount: viewModel.parentAccount,
        request: viewModel.request,
        action: viewModel.action,
        selectedDevice: viewModel.selectedDevice,
        setSelectedDevice: viewModel.setSelectedDevice,
        onDeviceActionResultCompleted: viewModel.onDeviceActionResultCompleted,
        onUserCancel: viewModel.onUserCancel,
      }),
    );
  });
});
