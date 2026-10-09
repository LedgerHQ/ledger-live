import React from "react";
import { render, screen } from "tests/testSetup";
import type { AlgorandGenericTransaction } from "@ledgerhq/live-common/families/algorand/types";
import StepAsset from "./StepAsset";
import type { StepProps } from "../types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("../fields/AsaSelector", () => {
  const React = jest.requireActual("react");
  return {
    __esModule: true,
    default: ({ onChange }: { onChange: (token: { id: string }) => void }) =>
      React.createElement(
        "button",
        { onClick: () => onChange({ id: "algorand/asa/31566704" }) },
        "pick",
      ),
  };
});
jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackPage: () => null,
}));

describe("StepAsset", () => {
  it("writes the selected ASA as the generic asset reference owned by the account", async () => {
    const onUpdateTransaction = jest.fn();
    const transaction = { family: "algorand", mode: "changeTrust" } as AlgorandGenericTransaction;
    const props = {
      account: { freshAddress: "ALGO_ADDRESS" },
      transaction,
      onUpdateTransaction,
      t: (k: string) => k,
    } as unknown as StepProps;

    const { user } = render(<StepAsset {...props} />);
    await user.click(screen.getByText("pick"));

    const [update] = onUpdateTransaction.mock.lastCall;
    expect(update(transaction)).toEqual({
      ...transaction,
      assetReference: "31566704",
      assetOwner: "ALGO_ADDRESS",
    });
  });
});
