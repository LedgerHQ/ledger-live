import { NeuronState } from "@ledgerhq/live-common/families/internet_computer/types";
import { renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { useNeuronActions } from "../NeuronManageFlow/useNeuronActions";
import { makeICPAccount, makeNeuron } from "./testUtils";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({ family: "internet_computer" }),
    updateTransaction: (t: object, patch: object) => ({ ...t, ...patch }),
  }),
}));

const account = makeICPAccount();

const setup = (state: NeuronState = NeuronState.Locked) => {
  const navigate = jest.fn();
  const { result } = renderHook(() =>
    useNeuronActions({ account, neuron: makeNeuron({ id: 42n, state }), navigate }),
  );
  return { actions: result.current, navigate };
};

const transactionOf = (navigate: jest.Mock) => navigate.mock.calls[0][1].transaction;
const screenOf = (navigate: jest.Mock) => navigate.mock.calls[0][0];

describe("useNeuronActions", () => {
  it("sends operations that need no user input straight to the device", () => {
    const { actions, navigate } = setup();

    actions.onDisburse();

    expect(screenOf(navigate)).toBe(ScreenName.InternetComputerNeuronSelectDevice);
    expect(transactionOf(navigate)).toMatchObject({ type: "disburse", neuronId: "42" });
  });

  it("routes operations that need input to their own screen", () => {
    const { actions, navigate } = setup();

    actions.onAddHotKey();

    expect(screenOf(navigate)).toBe(ScreenName.InternetComputerNeuronAddHotKey);
    expect(transactionOf(navigate)).toMatchObject({ type: "add_hot_key" });
  });

  it("starts a dissolve on a locked neuron and stops one on a dissolving neuron", () => {
    const locked = setup(NeuronState.Locked);
    locked.actions.onStartStopDissolving();
    expect(transactionOf(locked.navigate)).toMatchObject({ type: "start_dissolving" });

    const dissolving = setup(NeuronState.Dissolving);
    dissolving.actions.onStartStopDissolving();
    expect(transactionOf(dissolving.navigate)).toMatchObject({ type: "stop_dissolving" });
  });

  it("only lets a dissolved neuron set its delay outright; others may add to it", () => {
    const dissolved = setup(NeuronState.Dissolved);
    dissolved.actions.onSetDissolveDelay();
    expect(transactionOf(dissolved.navigate)).toMatchObject({ type: "set_dissolve_delay" });

    const locked = setup(NeuronState.Locked);
    locked.actions.onSetDissolveDelay();
    expect(transactionOf(locked.navigate)).toMatchObject({ type: "increase_dissolve_delay" });
  });

  it("carries the toggled value when switching automatic maturity staking", () => {
    const { actions, navigate } = setup();

    actions.onAutoStakeMaturity(true);

    expect(transactionOf(navigate)).toMatchObject({
      type: "auto_stake_maturity",
      autoStakeMaturity: true,
    });
  });

  it("names the hot key being removed", () => {
    const { actions, navigate } = setup();

    actions.onRemoveHotKey("some-principal");

    expect(transactionOf(navigate)).toMatchObject({
      type: "remove_hot_key",
      hotKeyToRemove: "some-principal",
    });
  });

  it("gives increase_stake its own amount screen rather than the send flow", () => {
    const { actions, navigate } = setup();

    actions.onIncreaseStake();

    expect(screenOf(navigate)).toBe(ScreenName.InternetComputerNeuronIncreaseStake);
    expect(transactionOf(navigate)).toMatchObject({ type: "increase_stake" });
  });

  it("confirms following as a refresh_voting_power call", () => {
    const { actions, navigate } = setup();

    actions.onConfirmFollowing();

    expect(transactionOf(navigate)).toMatchObject({ type: "refresh_voting_power" });
  });
});
