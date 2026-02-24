import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { render, screen } from "tests/testSetup";
import Box from "~/renderer/components/Box";
import useBuyDeviceDrawer from "../hooks/useBuyDeviceDrawer";
import BuyDevice from "..";

const mockConnect = jest.fn();
const mockBuyDevice = jest.fn();

jest.mock("LLD/hooks/useLazyOnboardingActions", () => ({
  __esModule: true,
  default: () => ({
    handleConnect: mockConnect,
    handleBuyDevice: mockBuyDevice,
  }),
}));

const Setup = () => {
  const { handleOpen } = useBuyDeviceDrawer();
  return (
    <Box>
      <Button onClick={handleOpen}>OPEN</Button>
      <BuyDevice />
    </Box>
  );
};

describe("Buy Device Dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays dialog correctly", async () => {
    const { user } = render(<Setup />);

    const button = screen.getByRole("button", { name: "OPEN" });
    await user.click(button);

    expect(screen.getByText("Connect a Ledger device")).toBeVisible();

    const connectButton = screen.getByRole("button", { name: "Connect" });
    expect(connectButton).toBeVisible();

    const buyDeviceButton = screen.getByRole("button", { name: "Buy your Ledger device" });
    expect(buyDeviceButton).toBeVisible();
  });

  it("when connect button clicked it calls connect action", async () => {
    const { user } = render(<Setup />);

    const button = screen.getByRole("button", { name: "OPEN" });
    await user.click(button);

    expect(screen.getByText("Connect a Ledger device")).toBeVisible();

    const connectButton = screen.getByRole("button", { name: "Connect" });
    expect(connectButton).toBeVisible();

    await user.click(connectButton);
    expect(mockConnect).toHaveBeenCalled();
    expect(screen.queryByText("Connect a Ledger device")).toBeNull();
  });

  it("when buy device button clicked it calls buy device action", async () => {
    const { user } = render(<Setup />);

    const button = screen.getByRole("button", { name: "OPEN" });
    await user.click(button);

    expect(screen.getByText("Connect a Ledger device")).toBeVisible();

    const buyDeviceButton = screen.getByRole("button", { name: "Buy your Ledger device" });
    expect(buyDeviceButton).toBeVisible();

    await user.click(buyDeviceButton);
    expect(mockBuyDevice).toHaveBeenCalled();
    expect(screen.queryByText("Connect a Ledger device")).toBeNull();
  });
});
