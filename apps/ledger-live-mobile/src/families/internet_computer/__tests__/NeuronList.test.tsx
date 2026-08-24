import { SECONDS_IN_DAY } from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import NeuronListScreen from "../NeuronManageFlow/NeuronList";
import { ICP_UNIT, makeHealthyNeuron, makeICPAccount } from "./testUtils";

let neurons: ICPNeuron[] = [];
let lastUpdatedMSecs = 0;
const mockNavigate = jest.fn();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({
    account: makeICPAccount({ neurons, lastUpdatedMSecs }),
    parentAccount: null,
  }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => null,
}));
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

const renderScreen = () =>
  render(
    <NeuronListScreen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{ navigate: mockNavigate } as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: { accountId: "icp-1" } } as any}
    />,
  );

describe("NeuronList", () => {
  beforeEach(() => {
    neurons = [];
    lastUpdatedMSecs = 0;
    mockNavigate.mockClear();
  });

  it("offers Sync with an empty list, since that is the only way a first neuron arrives", () => {
    renderScreen();

    expect(screen.getByText(/You have no neurons yet/, { exact: false })).toBeVisible();
    expect(screen.getByTestId("icp-sync-neurons-button")).toBeVisible();
  });

  it("reports never having synced rather than showing the epoch", () => {
    renderScreen();

    expect(screen.getByText(/Never/, { exact: false })).toBeVisible();
  });

  it("routes Sync to the device with a list_neurons transaction", () => {
    renderScreen();
    fireEvent.press(screen.getByTestId("icp-sync-neurons-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        transaction: expect.objectContaining({ type: "list_neurons" }),
      }),
    );
  });

  // The cell showed the raw cached stake, so a penalised neuron was listed with more stake than the
  // details screen and the account footer credit it with.
  it("lists the stake net of the fees the neuron has accrued", () => {
    neurons = [
      makeHealthyNeuron({
        id: 11n,
        cachedNeuronStakeE8s: 300_000_000n,
        neuronFeesE8s: 50_000_000n,
      }),
    ];

    renderScreen();

    expect(screen.getByText("2.5 ICP")).toBeVisible();
    expect(screen.queryByText("3 ICP")).toBeNull();
  });

  it("opens the details screen for the neuron that was tapped", () => {
    neurons = [makeHealthyNeuron({ id: 5n }), makeHealthyNeuron({ id: 9n })];
    renderScreen();

    fireEvent.press(screen.getByTestId("icp-neuron-row-9"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ neuronId: "9" }),
    );
  });

  it("surfaces the confirm-following route only while a neuron is actually decaying", () => {
    neurons = [makeHealthyNeuron({ id: 1n })];
    const healthy = renderScreen();
    expect(screen.queryByTestId("icp-refresh-voting-power-button")).toBeNull();
    healthy.unmount();

    neurons = [
      makeHealthyNeuron({
        id: 1n,
        votingPowerRefreshedTimestampSeconds: BigInt(
          Math.floor(Date.now() / 1000) - 195 * SECONDS_IN_DAY,
        ),
      }),
    ];
    renderScreen();
    expect(screen.getByTestId("icp-refresh-voting-power-button")).toBeVisible();
  });
});
