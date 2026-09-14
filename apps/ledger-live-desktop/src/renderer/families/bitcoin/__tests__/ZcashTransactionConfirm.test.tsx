import React from "react";
import { BigNumber } from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/types-devices";
import { render, screen, withFlagOverrides } from "tests/testSetup";
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

const mockDevice: Device = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const mockUnit = { code: "ZEC", magnitude: 8, name: "Zcash" };

const TRANSPARENT_RECIPIENT = "t1ZcashTransparentAddressXXXXXXXXXXXXXXXX";
const SHIELDED_RECIPIENT =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

const FALLBACK_TEST_ID = "fallback-confirm";
const fallback = <div data-testid={FALLBACK_TEST_ID} />;

type RecipientType = "public" | "private";

const buildTransaction = (
  recipient: string,
  amount = new BigNumber(1_000_000),
  recipientType: RecipientType = recipient.startsWith("t") ? "public" : "private",
) => ({ recipient, amount, recipientType }) as unknown as Transaction;

type RenderOptions = {
  amount?: BigNumber;
  currencyId?: string;
  shieldedEnabled?: boolean;
  device?: Device | null;
  onShown?: () => void;
  recipientType?: RecipientType;
};

const renderConfirm = (
  recipient: string,
  {
    amount = new BigNumber(1_000_000),
    currencyId = "zcash",
    shieldedEnabled = true,
    device = mockDevice,
    onShown = jest.fn(),
    recipientType,
  }: RenderOptions = {},
) =>
  render(
    <ZcashTransactionConfirm
      device={device}
      transaction={buildTransaction(
        recipient,
        amount,
        recipientType ?? (recipient.startsWith("t") ? "public" : "private"),
      )}
      unit={mockUnit}
      currencyId={currencyId}
      onShown={onShown}
      fallback={fallback}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: shieldedEnabled } }) },
  );

describe("ZcashTransactionConfirm", () => {
  it("renders the fallback when the zcashShielded flag is off", () => {
    renderConfirm(TRANSPARENT_RECIPIENT, { shieldedEnabled: false });
    expect(screen.getByTestId(FALLBACK_TEST_ID)).toBeVisible();
    expect(screen.queryByTestId("send-signature-prompt")).not.toBeInTheDocument();
  });

  it("renders the fallback for a non-Zcash currency even when the flag is on", () => {
    renderConfirm(TRANSPARENT_RECIPIENT, { currencyId: "bitcoin" });
    expect(screen.getByTestId(FALLBACK_TEST_ID)).toBeVisible();
    expect(screen.queryByTestId("send-signature-prompt")).not.toBeInTheDocument();
  });

  it("does not call onShown when the flag is off — the fallback owns its own onShown", () => {
    const onShown = jest.fn();
    renderConfirm(TRANSPARENT_RECIPIENT, { shieldedEnabled: false, onShown });
    expect(onShown).not.toHaveBeenCalled();
  });

  it("renders nothing when device is null", () => {
    const { container } = renderConfirm(TRANSPARENT_RECIPIENT, { device: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onShown exactly once when a device is provided", () => {
    const onShown = jest.fn();
    renderConfirm(TRANSPARENT_RECIPIENT, { onShown });
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it("transparent recipient: renders the full address in data-testid=zcash-confirm-transparent-address", () => {
    renderConfirm(TRANSPARENT_RECIPIENT);
    expect(screen.getByTestId("zcash-confirm-transparent-address")).toBeVisible();
    expect(screen.getByTestId("zcash-confirm-transparent-address")).toHaveTextContent(
      TRANSPARENT_RECIPIENT,
    );
  });

  it("shielded recipient: renders private-transaction label and amount", () => {
    renderConfirm(SHIELDED_RECIPIENT);
    expect(screen.getByTestId("zcash-private-transaction-label")).toBeVisible();
    expect(screen.getByTestId("zcash-confirm-amount")).toBeVisible();
  });

  it("shielded recipient: does NOT render the address", () => {
    renderConfirm(SHIELDED_RECIPIENT);
    expect(screen.queryByTestId("zcash-confirm-transparent-address")).not.toBeInTheDocument();
  });

  it("transparent-only Unified Address (recipientType public): renders the address, not the private label", () => {
    renderConfirm(SHIELDED_RECIPIENT, { recipientType: "public" });
    expect(screen.getByTestId("zcash-confirm-transparent-address")).toBeVisible();
    expect(screen.getByTestId("zcash-confirm-transparent-address")).toHaveTextContent(
      SHIELDED_RECIPIENT,
    );
    expect(screen.queryByTestId("zcash-private-transaction-label")).not.toBeInTheDocument();
  });
});
