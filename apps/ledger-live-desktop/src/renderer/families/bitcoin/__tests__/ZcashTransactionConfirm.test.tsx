import React from "react";
import { BigNumber } from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "tests/testSetup";
import { ZcashTransactionConfirm } from "../ZcashTransactionConfirm";

jest.mock("~/renderer/animations", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/hooks/useTheme", () => ({
  __esModule: true,
  default: () => ({ theme: "dark" }),
}));
jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: () => null,
}));
jest.mock("~/renderer/components/DeviceAction/DeviceBlocker", () => ({
  DeviceBlocker: () => null,
}));
jest.mock("LLD/utils/getProductName", () => ({
  getProductName: () => "Ledger Nano S",
}));
jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({ val, unit }: { val: { toString(): string }; unit: { code: string } }) => (
    <span>
      {val?.toString()} {unit?.code}
    </span>
  ),
}));

const mockDevice = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const mockUnit = { code: "ZEC", magnitude: 8, name: "Zcash" };

const TRANSPARENT_RECIPIENT = "t1ZcashTransparentAddressXXXXXXXXXXXXXXXX";
const SHIELDED_RECIPIENT =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

const renderConfirm = (
  recipient: string | undefined,
  amount = new BigNumber(1_000_000),
  onShown = jest.fn(),
) =>
  render(
    <ZcashTransactionConfirm
      device={mockDevice}
      transaction={{ recipient, amount }}
      unit={mockUnit}
      onShown={onShown}
    />,
  );

describe("ZcashTransactionConfirm", () => {
  it("renders nothing when device is null", () => {
    const { container } = render(
      <ZcashTransactionConfirm device={null} transaction={{}} unit={mockUnit} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onShown exactly once when a device is provided", () => {
    const onShown = jest.fn();
    renderConfirm(TRANSPARENT_RECIPIENT, new BigNumber(500_000), onShown);
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it("transparent recipient: renders the full address in data-testid=zcash-confirm-transparent-address", () => {
    renderConfirm(TRANSPARENT_RECIPIENT);
    expect(screen.getByTestId("zcash-confirm-transparent-address")).toHaveTextContent(
      TRANSPARENT_RECIPIENT,
    );
  });

  it("shielded recipient: renders private-transaction label and amount", () => {
    renderConfirm(SHIELDED_RECIPIENT);
    expect(screen.getByTestId("zcash-private-transaction-label")).toBeInTheDocument();
    expect(screen.getByTestId("zcash-confirm-amount")).toBeInTheDocument();
  });

  it("shielded recipient: does NOT render the address", () => {
    renderConfirm(SHIELDED_RECIPIENT);
    expect(screen.queryByTestId("zcash-confirm-transparent-address")).not.toBeInTheDocument();
  });
});
