import { SECONDS_IN_DAY } from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import RefreshVotingPower from "../NeuronManageFlow/RefreshVotingPower";
import { ICP_UNIT, makeHealthyNeuron, makeICPAccount } from "./testUtils";

// The confirmation window is six months at full power, then one month of decay, then power is lost.
// The fixture ages below are chosen to land in each of those three bands.
const nowSeconds = Math.floor(Date.now() / 1000);

let neurons: ICPNeuron[] = [];
const mockNavigate = jest.fn();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: makeICPAccount({ neurons }), parentAccount: null }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({ family: "internet_computer" }),
    updateTransaction: (t: object, patch: object) => ({ ...t, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  useICPNeurons: () => neurons,
}));

/** A neuron whose last confirmation was `daysAgo` days ago. */
const refreshedDaysAgo = (id: bigint, daysAgo: number) =>
  makeHealthyNeuron({
    id,
    votingPowerRefreshedTimestampSeconds: BigInt(nowSeconds - daysAgo * SECONDS_IN_DAY),
  });

const renderScreen = () =>
  render(
    <RefreshVotingPower
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{ navigate: mockNavigate } as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: { accountId: "icp-1" } } as any}
    />,
  );

describe("RefreshVotingPower", () => {
  beforeEach(() => {
    neurons = [];
    mockNavigate.mockClear();
  });

  it("tells the user nothing is on a confirmation clock when no neuron reports one", () => {
    // No votingPowerRefreshedTimestampSeconds: staleness is unknown, not zero.
    neurons = [makeHealthyNeuron({ votingPowerRefreshedTimestampSeconds: undefined })];

    renderScreen();

    expect(screen.getByText(/None of your neurons/, { exact: false })).toBeVisible();
  });

  it("marks a neuron that is already decaying, so it does not read like a healthy one", () => {
    neurons = [refreshedDaysAgo(1n, 195)];

    renderScreen();

    expect(screen.getByText(/losing power now/, { exact: false })).toBeVisible();
  });

  it("shows a plain countdown for a neuron that is still at full power", () => {
    neurons = [refreshedDaysAgo(1n, 40)];

    renderScreen();

    expect(screen.queryByText(/losing power now/, { exact: false })).toBeNull();
    expect(screen.queryByText("Already lost")).toBeNull();
  });

  it("calls out a neuron that has already lost its power", () => {
    neurons = [refreshedDaysAgo(1n, 400)];

    renderScreen();

    expect(screen.getByText("Already lost")).toBeVisible();
  });

  it("lists the neurons closest to losing power first", () => {
    neurons = [refreshedDaysAgo(1n, 10), refreshedDaysAgo(2n, 200), refreshedDaysAgo(3n, 100)];

    renderScreen();

    const rows = screen.getAllByText(/^[123]$/).map(node => node.props.children);
    expect(rows).toEqual(["2", "3", "1"]);
  });

  it("keeps a healthy neuron listed, since the NNS accepts a confirmation at any time", () => {
    neurons = [refreshedDaysAgo(1n, 1)];

    renderScreen();

    expect(screen.getAllByText("Confirm")).toHaveLength(1);
  });

  it("routes a confirmation to the device with a refresh_voting_power transaction", () => {
    neurons = [refreshedDaysAgo(7n, 200)];

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-confirm-following-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        neuronId: "7",
        transaction: expect.objectContaining({ type: "refresh_voting_power", neuronId: "7" }),
      }),
    );
  });

  it("leaves a neuron with no id out of the confirmable set", () => {
    neurons = [makeHealthyNeuron({ id: undefined })];

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-confirm-following-button"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
