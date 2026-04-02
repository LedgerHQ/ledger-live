import React from "react";
import { render, screen, act } from "tests/testSetup";
import PerpsSignRoot from "../PerpsSignDialog";
import { openPerpsSign } from "../PerpsSignDialog";

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

const perpsSignData = {
  appName: "Hyperliquid",
  signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
  onSuccess: jest.fn(),
  onError: jest.fn(),
  onCancel: jest.fn(),
};

describe("PerpsSign integration", () => {
  it("should render DeviceAction after openPerpsSign is called", () => {
    render(<PerpsSignRoot />);

    expect(screen.queryByTestId("device-action")).not.toBeInTheDocument();

    act(() => {
      openPerpsSign(perpsSignData);
    });

    expect(screen.getByTestId("device-action")).toBeVisible();
  });

  it("should not render content when no data is set", () => {
    render(<PerpsSignRoot />);

    expect(screen.queryByTestId("device-action")).not.toBeInTheDocument();
  });
});
