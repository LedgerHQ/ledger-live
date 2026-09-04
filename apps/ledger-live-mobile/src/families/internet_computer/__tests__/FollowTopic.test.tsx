import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import { ScreenName } from "~/const";
import FollowTopic from "../NeuronManageFlow/FollowTopic";
import { makeHealthyNeuron } from "./testUtils";

const GOVERNANCE = 4;

let transaction: Partial<Transaction>;
let neuron: ICPNeuron | undefined;

const mockNavigate = jest.fn();

const mockBackToList = jest.fn();

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: {},
    neuron,
    backToList: mockBackToList,
    transaction,
    bridge: { updateTransaction: (t: object, patch: object) => ({ ...t, ...patch }) },
    updateTransaction: jest.fn(),
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));
jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/internet_computer/react"),
  useICPPrincipal: () => "controller-principal",
}));

const renderScreen = () =>
  render(
    <FollowTopic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{ navigate: mockNavigate } as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: { accountId: "account-1", neuronId: "1", transaction } } as any}
    />,
  );

/** The transaction the screen would hand to the followee list. */
const handedOver = (): Partial<Transaction> => mockNavigate.mock.calls[0][1].transaction;

describe("FollowTopic", () => {
  beforeEach(() => {
    transaction = { type: "follow" };
    neuron = makeHealthyNeuron({ followees: [] });
    mockNavigate.mockClear();
  });

  it("names each topic rather than printing its wire identifier", () => {
    renderScreen();

    expect(screen.getByText("IC OS version deployment")).toBeVisible();
    expect(screen.getByText("All other topics")).toBeVisible();
    expect(screen.queryByText("IcOsVersionDeployment")).toBeNull();
    expect(screen.queryByText("Unspecified")).toBeNull();
  });

  /*
   * The topic used to live in navigation state while the transaction was seeded elsewhere, so the two
   * could disagree: picking a topic, going back and picking another showed the second and signed the
   * first. The transaction is now the only place it lives.
   */
  it("puts the chosen topic on the transaction it hands over", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("icp-follow-topic-Governance"));

    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.InternetComputerNeuronFollowees,
      expect.anything(),
    );
    expect(handedOver().followTopic).toBe("Governance");
  });

  // The canister replaces the whole list per `follow` call, so an unseeded submit would clear every
  // followee the neuron already had rather than leaving them untouched.
  it("seeds the list from the followees the neuron already has on that topic", () => {
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n, 99n] }] });

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-follow-topic-Governance"));

    expect(handedOver().followeesIds).toEqual(["42", "99"]);
  });

  it("ignores followees the neuron holds on other topics", () => {
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE + 1, followeeIds: [42n] }] });

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-follow-topic-Governance"));

    expect(handedOver().followeesIds).toEqual([]);
  });

  // Changing topic must re-seed, or the second topic is shown with the first one's followees.
  it("re-seeds when the topic changes", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [7n] }] });

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-follow-topic-ExchangeRate"));

    expect(handedOver().followTopic).toBe("ExchangeRate");
    expect(handedOver().followeesIds).toEqual([]);
  });

  // Re-seeding here would silently undo the edit the user just made.
  it("leaves an edit in progress alone when the same topic is re-picked", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n] }] });

    renderScreen();
    fireEvent.press(screen.getByTestId("icp-follow-topic-Governance"));

    expect(handedOver().followeesIds).toEqual(["7"]);
  });
});

// A refresh or a disburse drops a neuron from the snapshot, and this screen resolves its neuron live
// out of redux by the id in its route params — so it can lose the neuron with the user standing
// still. Rendering nothing left a blank screen.
describe("FollowTopic without its neuron", () => {
  beforeEach(() => {
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
});
