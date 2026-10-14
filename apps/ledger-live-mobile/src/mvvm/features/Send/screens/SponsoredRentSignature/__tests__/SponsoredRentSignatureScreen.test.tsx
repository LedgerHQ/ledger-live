import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SponsoredRentSignatureScreen } from "../SponsoredRentSignatureScreen";
import {
  useSponsoredRentSignatureViewModel,
  type SponsoredRentSignatureViewModel,
} from "../hooks/useSponsoredRentSignatureViewModel";

const mockDeviceIntentExecutorLWM = jest.fn();

jest.mock("../hooks/useSponsoredRentSignatureViewModel", () => ({
  useSponsoredRentSignatureViewModel: jest.fn(),
}));
jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  DeviceIntentExecutorLWM: (props: unknown) => {
    mockDeviceIntentExecutorLWM(props);
    return null;
  },
}));

const buildViewModel = (
  overrides: Partial<SponsoredRentSignatureViewModel> = {},
): SponsoredRentSignatureViewModel => ({
  step: { type: "loading" },
  craftingLabel: "Preparing energy rental…",
  feeAmountLabel: "3.2 USDT",
  cancelLabel: "Cancel",
  intentExtraProps: { strategyLabel: "Energy rental - Provider", feeLabel: "Rental fee: 3.2 USDT" },
  onIntentJobStateChanged: jest.fn(),
  onIntentJobError: jest.fn(),
  onUserCancel: jest.fn(),
  ...overrides,
});

describe("SponsoredRentSignatureScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the rent while crafting, with a way out", async () => {
    const viewModel = buildViewModel();
    jest.mocked(useSponsoredRentSignatureViewModel).mockReturnValue(viewModel);

    const { user } = render(<SponsoredRentSignatureScreen />);

    expect(screen.getByText("Preparing energy rental…")).toBeOnTheScreen();
    expect(screen.getByText("3.2 USDT")).toBeOnTheScreen();
    await user.press(screen.getByTestId("send-sponsored-rent-signature-cancel"));
    expect(viewModel.onUserCancel).toHaveBeenCalled();
    expect(mockDeviceIntentExecutorLWM).not.toHaveBeenCalled();
  });

  it("shows a device setup failure with a Cancel", async () => {
    const viewModel = buildViewModel({ step: { type: "error", error: new Error("module load") } });
    jest.mocked(useSponsoredRentSignatureViewModel).mockReturnValue(viewModel);

    const { user } = render(<SponsoredRentSignatureScreen />);

    expect(screen.getByTestId("send-sponsored-rent-signature-error")).toBeOnTheScreen();
    await user.press(screen.getByTestId("send-sponsored-rent-signature-error-cancel"));
    expect(viewModel.onUserCancel).toHaveBeenCalled();
  });

  it("hands the pinned intent, its labels and the callbacks to the executor", () => {
    const signIntent = { uuid: "tx-a" } as never;
    const deviceInitializationInput = { appName: "Tron" } as never;
    const viewModel = buildViewModel({
      step: { type: "signing", signIntent, deviceInitializationInput },
    });
    jest.mocked(useSponsoredRentSignatureViewModel).mockReturnValue(viewModel);

    render(<SponsoredRentSignatureScreen />);

    expect(mockDeviceIntentExecutorLWM).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: signIntent,
        deviceInitializationInput,
        intentComponentExtraProps: viewModel.intentExtraProps,
        onIntentJobStateChanged: viewModel.onIntentJobStateChanged,
        onIntentJobError: viewModel.onIntentJobError,
        onUserCancel: viewModel.onUserCancel,
      }),
    );
    expect(screen.queryByText("Preparing energy rental…")).toBeNull();
  });
});
