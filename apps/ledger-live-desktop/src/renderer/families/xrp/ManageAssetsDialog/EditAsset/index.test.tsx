import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "tests/testSetup";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { UserEvent } from "@testing-library/user-event";
import { EditAsset } from "./index";
import { XRP_ACCOUNT, makeXrpTokenAccount } from "../../__mocks__/account.mock";
import {
  makeNamedError,
  mockBroadcast,
  mockSignedInput,
  signedOperation,
} from "../../__mocks__/signing.mock";

const mockStatus = { errors: {} as Record<string, Error>, warnings: {} };
const mockBridge: { pending: boolean; error: Error | null } = { pending: false, error: null };

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () =>
  require("../../__mocks__/signing.mock"),
);
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => {
  const { useState } = jest.requireActual("react");
  return {
    __esModule: true,
    default: (_: unknown, init: () => { transaction: object }) => {
      const [transaction, setTransaction] = useState(() => init().transaction);
      return {
        transaction,
        updateTransaction: setTransaction,
        status: mockStatus,
        bridgePending: mockBridge.pending,
        bridgeError: mockBridge.error,
      };
    },
  };
});
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () =>
  require("../../__mocks__/signing.mock"),
);
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: require("../../__mocks__/signing.mock").createIntent,
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => require("../../__mocks__/signing.mock"));

const ONE_RLUSD = new BigNumber(1).shiftedBy(38);
const tokenAccount: XrpTokenAccount = {
  ...makeXrpTokenAccount({ limit: ONE_RLUSD.times(1000), isRippling: false }),
  balance: ONE_RLUSD.times(10),
};

function renderEditAsset(editedAccount: XrpTokenAccount = tokenAccount) {
  const onBack = jest.fn();
  const onClose = jest.fn();
  const rendered = render(
    <Dialog open>
      <DialogContent>
        <EditAsset
          account={XRP_ACCOUNT}
          tokenAccount={editedAccount}
          onBack={onBack}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>,
    { initialState: { accounts: [XRP_ACCOUNT] } },
  );

  return { ...rendered, onBack, onClose };
}

function getContinue() {
  return screen.getByTestId("xrp-edit-asset-continue");
}

function getLimitRow() {
  return screen.getByTestId("xrp-trust-limit-row");
}

function getRipplingRow() {
  return screen.getByTestId("xrp-trust-rippling-row");
}

function getLimitInput() {
  return screen.getByTestId("xrp-trust-limit-input");
}

function getLimitConfirm() {
  return screen.getByTestId("xrp-trust-limit-confirm");
}

async function activateRippling(user: UserEvent) {
  await user.click(getRipplingRow());
  await user.click(await screen.findByRole("menuitemradio", { name: "Activated" }));
}

async function typeLimit(user: UserEvent, text: string) {
  await user.click(getLimitRow());
  await user.clear(getLimitInput());
  if (text) await user.type(getLimitInput(), text);
}

describe("xrp EditAsset", () => {
  beforeEach(() => {
    mockStatus.errors = {};
    mockBridge.pending = false;
    mockBridge.error = null;
    mockBroadcast.mockReset();
    mockSignedInput.mockReset();
  });

  describe("Edit details", () => {
    it("shows the current settings, and keeps Continue off until something changes", () => {
      renderEditAsset();

      expect(screen.getByRole("dialog", { name: "Edit details" })).toBeVisible();
      expect(getLimitRow()).toHaveTextContent("1,000 RLUSD");
      expect(getRipplingRow()).toHaveTextContent("Deactivated");
      expect(getContinue()).toBeDisabled();
    });

    it("names each setting control with its setting and value", () => {
      renderEditAsset();

      expect(getLimitRow()).toHaveAccessibleName(/^Balance limit: 1,000\sRLUSD$/);
      expect(getRipplingRow()).toHaveAccessibleName("Rippling: Deactivated");
    });

    it("shows a failed status load, which keeps retrying, and keeps Continue off", () => {
      mockBridge.pending = true;
      mockBridge.error = new Error("network down");
      renderEditAsset();

      expect(screen.getByTestId("xrp-edit-asset-error")).toBeVisible();
      expect(getContinue()).toBeDisabled();
    });

    it("shows Maximum for the protocol maximum", () => {
      renderEditAsset({
        ...tokenAccount,
        xrpResources: {
          isLocked: false,
          limit: MAX_TRUST_LIMIT,
          isRippling: true,
        },
      });

      expect(getLimitRow()).toHaveTextContent("Maximum");
      expect(getRipplingRow()).toHaveTextContent("Activated");
    });

    it("warns when the current limit is 0", () => {
      renderEditAsset({
        ...tokenAccount,
        xrpResources: {
          isLocked: false,
          limit: new BigNumber(0),
          isRippling: false,
        },
      });

      expect(screen.getByText("Your limit is 0: you can't receive this token.")).toBeVisible();
    });

    it("goes back to Manage assets from its back arrow", async () => {
      const { user, onBack } = renderEditAsset();

      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("shows a status error of a change, and keeps Continue off", async () => {
      mockStatus.errors = { amount: makeNamedError("NotEnoughBalance") };
      const { user } = renderEditAsset();

      await activateRippling(user);

      expect(screen.getByTestId("xrp-edit-asset-error")).toBeVisible();
      expect(getContinue()).toBeDisabled();
    });

    it("hides the unchanged-settings error while nothing changed", () => {
      mockStatus.errors = { transaction: makeNamedError("XrpTrustSetUnchanged") };
      renderEditAsset();

      expect(screen.queryByTestId("xrp-edit-asset-error")).not.toBeInTheDocument();
    });

    it("hides the status error of the previous settings while the new status loads", async () => {
      mockStatus.errors = { transaction: makeNamedError("XrpTrustSetUnchanged") };
      mockBridge.pending = true;
      const { user } = renderEditAsset();

      await activateRippling(user);

      expect(screen.queryByTestId("xrp-edit-asset-error")).not.toBeInTheDocument();
      expect(getContinue()).toBeDisabled();
    });
  });

  describe("Rippling menu", () => {
    it("checks the current value", async () => {
      const { user } = renderEditAsset();

      await user.click(getRipplingRow());

      expect(await screen.findByRole("menuitemradio", { name: "Deactivated" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("menuitemradio", { name: "Activated" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });

    it("selects a value, closes, and enables Continue", async () => {
      const { user } = renderEditAsset();

      await activateRippling(user);

      expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
      expect(getRipplingRow()).toHaveTextContent("Activated");
      expect(getContinue()).toBeEnabled();
    });
  });

  describe("Balance limit step", () => {
    it("opens prefilled with the current limit", async () => {
      const { user } = renderEditAsset();

      await user.click(getLimitRow());

      expect(screen.getByRole("dialog", { name: "Balance limit" })).toHaveAccessibleDescription(
        "Select the maximum amount of this asset your account can hold.",
      );
      expect(getLimitInput()).toHaveValue("1000");
    });

    it("keeps a confirmed limit, which enables Continue", async () => {
      const { user } = renderEditAsset();

      await typeLimit(user, "500");
      await user.click(getLimitConfirm());

      expect(getLimitRow()).toHaveTextContent("500 RLUSD");
      expect(getContinue()).toBeEnabled();
    });

    it("drops a typed limit when the user goes back", async () => {
      const { user } = renderEditAsset();

      await typeLimit(user, "500");
      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(getLimitRow()).toHaveTextContent("1,000 RLUSD");
      expect(getContinue()).toBeDisabled();
    });

    it("sets the protocol maximum, shown as Maximum", async () => {
      const { user } = renderEditAsset();

      await user.click(getLimitRow());
      await user.click(screen.getByRole("button", { name: "Set to maximum" }));

      expect(getLimitInput()).toHaveValue(MAX_TRUST_LIMIT.shiftedBy(-38).toFixed());

      await user.click(getLimitConfirm());

      expect(getLimitRow()).toHaveTextContent("Maximum");
    });

    it("blocks Confirm for an empty field, without an error", async () => {
      const { user } = renderEditAsset();

      await typeLimit(user, "");

      expect(getLimitConfirm()).toBeDisabled();
      expect(screen.queryByText("The limit must be above 0")).not.toBeInTheDocument();
    });

    it("blocks Confirm for a limit of 0, with its error", async () => {
      mockStatus.errors = { amount: makeNamedError("XrpTrustLimitZero") };
      const { user } = renderEditAsset();

      await typeLimit(user, "0");

      expect(screen.getByText("The limit must be above 0")).toBeVisible();
      expect(getLimitConfirm()).toBeDisabled();
    });

    it("hides a limit error of the previous limit while the new status loads", async () => {
      mockStatus.errors = { amount: makeNamedError("XrpTrustLimitZero") };
      mockBridge.pending = true;
      const { user } = renderEditAsset();

      await typeLimit(user, "500");

      expect(screen.queryByText("The limit must be above 0")).not.toBeInTheDocument();
      expect(getLimitConfirm()).toBeDisabled();
    });

    it("shows Confirm loading while the new status loads", async () => {
      mockBridge.pending = true;
      const { user } = renderEditAsset();

      await typeLimit(user, "500");

      expect(getLimitConfirm()).toBeDisabled();
      expect(within(getLimitConfirm()).getByRole("img", { name: /loading/i })).toBeVisible();
    });

    it("blocks Confirm for a limit error of the status", async () => {
      mockStatus.errors = { amount: makeNamedError("XrpTrustLimitTooHigh") };
      const { user } = renderEditAsset();

      await user.click(getLimitRow());

      expect(screen.getByText("The limit is above the maximum")).toBeVisible();
      expect(getLimitConfirm()).toBeDisabled();
    });

    it("blocks Confirm for a limit below the balance, with its error", async () => {
      const { user } = renderEditAsset();

      await typeLimit(user, "5");

      expect(screen.getByText(/Your balance \(10 RLUSD\) is above this limit/)).toBeVisible();
      expect(getLimitConfirm()).toBeDisabled();
    });
  });

  describe("signing", () => {
    it("signs a changeTrust with the new settings and no sub account", async () => {
      mockBroadcast.mockResolvedValue(signedOperation.operation);
      const { user } = renderEditAsset();

      await typeLimit(user, "500");
      await user.click(getLimitConfirm());
      await activateRippling(user);
      await user.click(getContinue());
      await screen.findByRole("button", { name: "Sign on device" });

      expect(mockSignedInput).toHaveBeenCalledTimes(1);
      const { transaction } = mockSignedInput.mock.calls[0][0];
      expect(transaction).toMatchObject({
        mode: "changeTrust",
        amount: ONE_RLUSD.times(500),
        noRipple: false,
      });
      expect(transaction).not.toHaveProperty("subAccountId");
    });

    it("goes back to Edit details with the entered values when the device step is left", async () => {
      const { user } = renderEditAsset();

      await activateRippling(user);
      await user.click(getContinue());
      await user.click(await screen.findByRole("button", { name: "Cancel on device" }));

      expect(getRipplingRow()).toHaveTextContent("Activated");
      expect(getContinue()).toBeEnabled();
    });

    it("shows success, links the operation, and closes on Got it", async () => {
      mockBroadcast.mockResolvedValue(signedOperation.operation);
      const { user, onClose } = renderEditAsset();

      await activateRippling(user);
      await user.click(getContinue());
      await user.click(await screen.findByRole("button", { name: "Sign on device" }));

      expect(await screen.findByText("Token settings updated")).toBeVisible();
      expect(screen.getByTestId("xrp-signature-view-details")).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Got it" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("explains a broadcast error may have failed, and Try again returns to Edit details", async () => {
      mockBroadcast.mockRejectedValue(new Error("broadcast failed"));
      const { user } = renderEditAsset();

      await activateRippling(user);
      await user.click(getContinue());
      await user.click(await screen.findByRole("button", { name: "Sign on device" }));

      expect(await screen.findByTestId("xrp-signature-error")).toBeVisible();
      expect(screen.getByText(/Your transaction may have failed/)).toBeVisible();
      expect(screen.getByTestId("xrp-signature-close")).toBeVisible();

      await user.click(screen.getByTestId("xrp-signature-retry"));

      expect(getRipplingRow()).toHaveTextContent("Activated");
    });
  });
});
