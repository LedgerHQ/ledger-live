import React from "react";
import { render, screen } from "tests/testSetup";
import PerpsSignModal from "../PerpsSignModal";
import { setPerpsSignData, clearPerpsSignData } from "../perpsSignDialog";

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({ connectApp: jest.fn() }),
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: (props: { onResult: (r: unknown) => void }) => (
    <div data-testid="device-action" onClick={() => props.onResult({ device: {} })}>
      DeviceAction
    </div>
  ),
}));

jest.mock(
  "LLD/features/Send/screens/Signature/components/SimplifiedTransactionConfirm",
  () => ({
    SimplifiedTransactionConfirm: () => <div data-testid="sign-confirm">SignConfirm</div>,
  }),
);

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: () => <div data-testid="dialog-header" />,
  DialogBody: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-body">{children}</div>
  ),
}));

describe("PerpsSign integration", () => {
  afterEach(() => {
    clearPerpsSignData();
  });

  it("should render DeviceAction in connect phase when dialog is open", () => {
    setPerpsSignData({
      appName: "Hyperliquid",
      signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onCancel: jest.fn(),
    });

    render(<PerpsSignModal />, {
      initialState: { dialogs: { PERPS_SIGNING: true } },
    });

    expect(screen.getByTestId("device-action")).toBeVisible();
  });

  it("should not render content when dialog is closed", () => {
    render(<PerpsSignModal />, {
      initialState: { dialogs: { PERPS_SIGNING: false } },
    });

    expect(screen.queryByTestId("device-action")).not.toBeInTheDocument();
  });

  it("should not render body when no data is provided", () => {
    render(<PerpsSignModal />, {
      initialState: { dialogs: { PERPS_SIGNING: true } },
    });

    expect(screen.queryByTestId("device-action")).not.toBeInTheDocument();
  });
});
