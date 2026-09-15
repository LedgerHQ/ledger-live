import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import React from "react";
import SplitNeuron from "../NeuronManageFlow/SplitNeuron";
import { ICP_UNIT, makeHealthyNeuron, makeICPAccount } from "./testUtils";

let transaction: Partial<Transaction>;
let neuron: ICPNeuron | undefined;

const mockBackToList = jest.fn();

jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));
jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: makeICPAccount({ neurons: [] }),
    neuron,
    backToList: mockBackToList,
    transaction,
    updateTransaction: jest.fn(),
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));

const renderScreen = () =>
  render(
    <SplitNeuron
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{} as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: {} } as any}
    />,
  );

// A refresh or a disburse drops a neuron from the snapshot, and this screen resolves its neuron live
// out of redux by the id in its route params — so it can lose the neuron with the user standing
// still. Rendering nothing left a blank screen.
describe("SplitNeuron without its neuron", () => {
  beforeEach(() => {
    transaction = { type: "split_neuron", amount: new BigNumber(0) };
    neuron = makeHealthyNeuron();
    mockBackToList.mockClear();
  });

  it("explains itself instead of rendering a blank screen", () => {
    neuron = undefined;

    renderScreen();

    expect(screen.getByText(/no longer in your synced snapshot/)).toBeVisible();
  });

  it("offers the way back to the neuron list", () => {
    neuron = undefined;

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-missing-neuron-back-button"));

    expect(mockBackToList).toHaveBeenCalled();
  });

  it("shows the split amount input while the neuron is there", () => {
    renderScreen();

    expect(screen.getByTestId("icp-split-amount-input")).toBeVisible();
  });
});
