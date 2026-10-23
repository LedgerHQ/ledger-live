/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import {
  useSponsoredRentSignatureViewModel,
  type SponsoredRentSignatureViewModel,
} from "../hooks/useSponsoredRentSignatureViewModel";
import { SponsoredRentSignatureScreen } from "../SponsoredRentSignatureScreen";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-react");
  return {
    ...actual,
    DialogBody: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  };
});

jest.mock("../hooks/useSponsoredRentSignatureViewModel", () => ({
  useSponsoredRentSignatureViewModel: jest.fn(),
}));

// What the real DeviceAction hands its `Result` once the action has produced a payload.
let mockDeviceActionResult: Record<string, unknown>;

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: ({ Result }: { Result: React.ComponentType<Record<string, unknown>> }) => (
    <div data-testid="device-action">
      <Result {...mockDeviceActionResult} />
    </div>
  ),
}));

const mockedUseSponsoredRentSignatureViewModel = jest.mocked(useSponsoredRentSignatureViewModel);

const craftingLabel = "Preparing energy rental";
const submittingLabel = "Submitting energy rental payment";

const viewModel: SponsoredRentSignatureViewModel = {
  isCrafting: false,
  craftingLabel,
  submittingLabel,
  strategyLabel: "Energy rental - Provider",
  feeLabel: "Rental fee",
  feeAmountLabel: "1.5 USDT",
  request: {
    account: { id: "acc_tron" },
    parentAccount: null,
    transaction: "0a02abcd",
    broadcast: false,
  } as SponsoredRentSignatureViewModel["request"],
  action: {} as SponsoredRentSignatureViewModel["action"],
  onResult: jest.fn(),
  signError: null,
  onRetrySign: jest.fn(),
  cancelLabel: "Cancel",
  onCancel: jest.fn(),
};

describe("SponsoredRentSignatureScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceActionResult = {};
    mockedUseSponsoredRentSignatureViewModel.mockReturnValue(viewModel);
  });

  it("shows the spinner with the submitting label once the rent payment is signed", () => {
    mockDeviceActionResult = {
      signedOperation: { operation: { id: "op-a" }, signature: "signed-tx-a" },
      device: { deviceId: "device-id" },
    };
    render(<SponsoredRentSignatureScreen />);

    expect(screen.getByTestId("device-action-loader")).toBeVisible();
    expect(screen.getByText(submittingLabel)).toBeVisible();
    expect(screen.queryByText(craftingLabel)).toBeNull();
  });

  it.each([
    ["no signedOperation key", { device: { deviceId: "device-id" } }],
    ["an undefined signedOperation", { signedOperation: undefined, device: {} }],
    ["a null signedOperation", { signedOperation: null, device: {} }],
  ])("renders no result before the payment is signed (%s)", (_label, result) => {
    mockDeviceActionResult = result;
    render(<SponsoredRentSignatureScreen />);

    expect(screen.getByTestId("device-action")).toBeVisible();
    expect(screen.queryByTestId("device-action-loader")).toBeNull();
    expect(screen.queryByText(submittingLabel)).toBeNull();
  });

  it("shows the crafting label instead of the device action while the rent payment is being crafted", () => {
    // A request is set too, so this proves crafting wins over the device action.
    mockedUseSponsoredRentSignatureViewModel.mockReturnValue({ ...viewModel, isCrafting: true });
    render(<SponsoredRentSignatureScreen />);

    expect(screen.getByTestId("device-action-loader")).toBeVisible();
    expect(screen.getByText(craftingLabel)).toBeVisible();
    expect(screen.queryByText(submittingLabel)).toBeNull();
    expect(screen.queryByTestId("device-action")).toBeNull();
  });
});
