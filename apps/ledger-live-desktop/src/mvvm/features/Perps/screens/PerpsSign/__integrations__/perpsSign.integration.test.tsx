import React from "react";
import { render, screen, act } from "tests/testSetup";
import PerpsSignRoot, { openPerpsSign } from "../PerpsSignDialog";

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

jest.mock("LLD/features/Send/screens/Signature/components/SimplifiedTransactionConfirm", () => ({
  SimplifiedTransactionConfirm: () => <div data-testid="sign-confirm">SignConfirm</div>,
}));

const perpsSignData = {
  appName: "Hyperliquid",
  signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
  signOnSession: jest.fn().mockResolvedValue({ signatures: [] }),
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

  it("should reset to DeviceAction and cancel the previous request when replaced mid-sign", async () => {
    const first = {
      ...perpsSignData,
      signFactory: jest.fn(() => new Promise<never>(() => {})),
      onCancel: jest.fn(),
    };
    const second = {
      ...perpsSignData,
      signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
      onCancel: jest.fn(),
    };
    const { user } = render(<PerpsSignRoot />);

    act(() => openPerpsSign(first));
    await user.click(screen.getByTestId("device-action"));
    expect(screen.getByTestId("sign-confirm")).toBeVisible();
    expect(first.signFactory).toHaveBeenCalledTimes(1);

    act(() => openPerpsSign(second));

    expect(first.onCancel).toHaveBeenCalled();
    expect(second.signFactory).not.toHaveBeenCalled();
    expect(screen.getByTestId("device-action")).toBeVisible();
  });
});
