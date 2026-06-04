import React from "react";
import { Observable } from "rxjs";
import type { SignatureRequest } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import type { SignTransactionIntent } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor";
import { render, screen } from "@tests/test-renderer";
import { SignatureScreen } from "../index";
import * as UseSignatureViewModelModule from "../hooks/useSignatureViewModel";
import { createBitcoinTransaction } from "../../CoinControl/hooks/__tests__/helpers";
import { createMockAccount } from "../../Recipient/hooks/__tests__/accounts";

type SignatureViewModel = ReturnType<typeof UseSignatureViewModelModule.useSignatureViewModel>;

const mockAccount = createMockAccount({ id: "account-1" });
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

jest.mock(
  "@ledgerhq/live-common/firebase/featureFlags",
  () => ({
    getFeature: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  "@features/platform-feature-flags",
  () => ({
    formatToFirebaseFeatureId: (featureId: string) => featureId,
    useFeature: jest.fn(),
    useFeatureFlags: jest.fn(() => ({})),
  }),
  { virtual: true },
);

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

function buildViewModel(overrides: Partial<SignatureViewModel> = {}): SignatureViewModel {
  return {
    account: mockAccount,
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

describe("SignatureScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(UseSignatureViewModelModule.useSignatureViewModel)
      .mockReturnValue(buildViewModel());
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

  it("should render DeviceIntentExecutorLWM with signature props", () => {
    const viewModel = buildViewModel();
    jest.mocked(UseSignatureViewModelModule.useSignatureViewModel).mockReturnValue(viewModel);

    render(<SignatureScreen />);

    expect(screen.getByTestId("send-signature-step")).toBeOnTheScreen();
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
});
