import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Operation, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import { EditAsset } from "./index";
import { XRP_ACCOUNT, makeXrpTokenAccount } from "../../__mocks__/account.mock";

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();
const mockStatus = { errors: {} as Record<string, Error>, warnings: {} };
const signedOperation = {
  operation: { id: "op-edit", accountId: XRP_ACCOUNT.id, hash: "", type: "OPT_IN" },
  signature: "signature",
} as unknown as SignedOperation;

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({ family: "xrp" }),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
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
        bridgePending: false,
      };
    },
  };
});
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: (_: unknown, input: unknown, callbacks: unknown) => ({ input, callbacks }),
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: () => Promise.resolve({}),
  DeviceIntentExecutor: (props: {
    intent: { callbacks: { onResult: (result: SignedOperation) => void } };
    onIntentJobComplete: () => void;
  }) => (
    <button
      onClick={() => {
        props.intent.callbacks.onResult(signedOperation);
        props.onIntentJobComplete();
      }}
    >
      Sign on device
    </button>
  ),
}));

const ONE_RLUSD = new BigNumber(1).shiftedBy(38);
const tokenAccount = {
  ...makeXrpTokenAccount({ limit: ONE_RLUSD.times(1000), isRippling: false }),
  balance: ONE_RLUSD.times(10),
};

function renderEditAsset(editedAccount: TokenAccount = tokenAccount) {
  const onBackToList = jest.fn();
  const rendered = render(
    <Dialog open>
      <DialogContent>
        <EditAsset
          account={XRP_ACCOUNT}
          tokenAccount={editedAccount}
          onBackToList={onBackToList}
          onClose={jest.fn()}
        />
      </DialogContent>
    </Dialog>,
    { initialState: { accounts: [XRP_ACCOUNT] } },
  );

  return { ...rendered, onBackToList };
}

function getContinue() {
  return screen.getByTestId("xrp-edit-asset-continue");
}

function getLimitInput() {
  return screen.getByTestId("xrp-trust-limit-input");
}

describe("xrp EditAsset", () => {
  beforeEach(() => {
    mockStatus.errors = {};
    mockBroadcast.mockReset();
  });

  it("shows the current settings, and keeps Continue off until something changes", () => {
    renderEditAsset();

    expect(screen.getByRole("dialog", { name: "Edit details" })).toBeVisible();
    expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("1,000 RLUSD");
    expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Deactivated");
    expect(getContinue()).toBeDisabled();
  });

  it("goes back to the list from its back arrow", async () => {
    const { user, onBackToList } = renderEditAsset();

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(onBackToList).toHaveBeenCalledTimes(1);
  });

  it("turns on rippling from the menu, which enables Continue", async () => {
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-rippling-row"));
    await user.click(await screen.findByRole("menuitemradio", { name: "Activated" }));

    expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Activated");
    expect(getContinue()).toBeEnabled();
  });

  it("keeps a confirmed limit, which enables Continue", async () => {
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-limit-row"));
    expect(getLimitInput()).toHaveValue("1000");

    await user.clear(getLimitInput());
    await user.type(getLimitInput(), "500");
    await user.click(screen.getByTestId("xrp-trust-limit-confirm"));

    expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("500 RLUSD");
    expect(getContinue()).toBeEnabled();
  });

  it("drops a typed limit when the user goes back", async () => {
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-limit-row"));
    await user.clear(getLimitInput());
    await user.type(getLimitInput(), "500");
    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("1,000 RLUSD");
    expect(getContinue()).toBeDisabled();
  });

  it("puts the maximum limit in the input, and shows it as Maximum", async () => {
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-limit-row"));
    await user.click(screen.getByRole("button", { name: "Set to maximum" }));

    const maxText = MAX_TRUST_LIMIT.shiftedBy(-38).toFixed();
    expect(getLimitInput()).toHaveValue(maxText);

    await user.click(screen.getByTestId("xrp-trust-limit-confirm"));

    expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("Maximum");
  });

  it("shows a limit error under the input and blocks Confirm", async () => {
    mockStatus.errors = { amount: Object.assign(new Error(), { name: "XrpTrustLimitTooHigh" }) };
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-limit-row"));

    expect(screen.getByText("The limit is above the maximum")).toBeVisible();
    expect(screen.getByTestId("xrp-trust-limit-confirm")).toBeDisabled();
  });

  it("warns under the input when the limit is below the balance, without blocking Confirm", async () => {
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-limit-row"));
    await user.clear(getLimitInput());
    await user.type(getLimitInput(), "5");

    expect(screen.getByText(/is above this limit/)).toBeVisible();
    expect(screen.getByTestId("xrp-trust-limit-confirm")).toBeEnabled();
  });

  it("signs the change and shows success", async () => {
    mockBroadcast.mockResolvedValue(signedOperation.operation);
    const { user } = renderEditAsset();

    await user.click(screen.getByTestId("xrp-trust-rippling-row"));
    await user.click(await screen.findByRole("menuitemradio", { name: "Activated" }));
    await user.click(getContinue());
    await user.click(await screen.findByRole("button", { name: "Sign on device" }));

    expect(await screen.findByText("RLUSD settings updated")).toBeVisible();
  });
});
