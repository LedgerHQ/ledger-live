import { MAX_FOLLOWEES_PER_TOPIC } from "@ledgerhq/live-common/families/internet_computer/consts";
import Clipboard from "@react-native-clipboard/clipboard";
import type {
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import React from "react";
import Followees from "../NeuronManageFlow/Followees";
import { makeHealthyNeuron } from "./testUtils";

const GOVERNANCE = 4;
// makeNeuron's default id, which is what makes an entry of it a self-follow.
const SELF_ID = "1";

let transaction: Partial<Transaction>;
let neuron: ICPNeuron | undefined;

// The screen drives the followee list through updateTransaction, so the mock applies each updater
// to keep `transaction` the record of what would actually be submitted.
const updateTransaction = jest.fn((updater: (tx: Partial<Transaction>) => Partial<Transaction>) => {
  transaction = updater(transaction);
});

const mockBackToList = jest.fn();

jest.mock("../NeuronManageFlow/useNeuronAction", () => ({
  useNeuronAction: () => ({
    account: {},
    neuron,
    backToList: mockBackToList,
    transaction,
    updateTransaction,
    status: { errors: {}, warnings: {} },
    bridgePending: false,
    continueToDevice: jest.fn(),
  }),
}));

const renderScreen = () =>
  render(
    <Followees
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{} as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      route={{ params: {} } as any}
    />,
  );

describe("Followees", () => {
  beforeEach(() => {
    transaction = { type: "follow" };
    neuron = makeHealthyNeuron({ followees: [] });
    updateTransaction.mockClear();
  });

  // The topic names the list being edited, and it is read off the transaction the device will sign
  // rather than held here, so the two cannot disagree.
  it("names the topic the transaction carries", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();

    expect(screen.getByText(/Governance/)).toBeVisible();
  });

  it("adds a well-formed neuron id to the list", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "123");
    fireEvent.press(screen.getByTestId("icp-followee-add-button"));

    expect(transaction.followeesIds).toEqual(["123"]);
  });

  it.each([
    ["rrkah-fqaaa-cai", /digits only/],
    ["12a3", /digits only/],
    ["0", /not a valid neuron ID/],
    // A real 20-digit id starts with 1, so mistyping that digit clears the nat64 ceiling.
    ["23194199462915819287", /not a valid neuron ID/],
    [SELF_ID, /cannot follow itself/],
    // Same neuron as the "99" the list already holds, so the check has to compare canonically.
    ["099", /already a followee/],
  ])("refuses to add %s, and says why", (entry, notice) => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["99"] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), entry);

    expect(screen.getByTestId("icp-followee-notice")).toHaveTextContent(notice);
    expect(screen.getByTestId("icp-followee-add-button")).toBeDisabled();
  });

  it("adds nothing when the disabled Add is pressed anyway", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "7");
    fireEvent.press(screen.getByTestId("icp-followee-add-button"));

    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("tells the user to tap Add while a valid id sits unadded", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "123");

    expect(screen.getByTestId("icp-followee-notice")).toHaveTextContent(/Tap Add/);
  });

  // The canister refuses the whole `follow` call past the cap, so the list has to stop short of it
  // rather than spend a signature on a request that cannot be accepted.
  it("stops offering Add once the topic holds its maximum followees", () => {
    const full = Array.from({ length: MAX_FOLLOWEES_PER_TOPIC }, (_, i) => String(i + 10));
    transaction = { type: "follow", followTopic: "Governance", followeesIds: full };

    renderScreen();

    expect(screen.getByTestId("icp-followee-notice")).toHaveTextContent(
      new RegExp(`at most ${MAX_FOLLOWEES_PER_TOPIC} neurons`),
    );
    expect(screen.getByTestId("icp-followee-add-button")).toBeDisabled();
  });

  // Together these two cover what the atCapacity copy instructs: remove one, then add another.
  it("drops back below the cap when a followee is removed", () => {
    const full = Array.from({ length: MAX_FOLLOWEES_PER_TOPIC }, (_, i) => String(i + 10));
    transaction = { type: "follow", followTopic: "Governance", followeesIds: full };

    renderScreen();
    fireEvent.press(screen.getAllByText("Remove")[0]);

    expect(transaction.followeesIds).toHaveLength(MAX_FOLLOWEES_PER_TOPIC - 1);
  });

  it("offers Add while the list is one short of the cap", () => {
    const nearlyFull = Array.from({ length: MAX_FOLLOWEES_PER_TOPIC - 1 }, (_, i) =>
      String(i + 10),
    );
    transaction = { type: "follow", followTopic: "Governance", followeesIds: nearlyFull };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "999");

    expect(screen.getByTestId("icp-followee-add-button")).toBeEnabled();
  });

  // An id left in the field is not in the list `follow` submits, so signing would drop it silently.
  it("holds Continue while an addable id is still in the field", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "8");

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  /*
   * Blocking on any non-empty entry left the user nowhere: Add greyed out because the id is already
   * a followee, Continue greyed out too, and no copy saying to clear the field. Nothing is dropped
   * by continuing here — the id is in the list already.
   */
  it("lets Continue through when the entry is already a followee", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7"] };

    renderScreen();
    fireEvent.changeText(screen.getByTestId("icp-followee-input"), "7");

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  it("puts each followee id on the clipboard rather than leaving it to be retyped", () => {
    const id = "13194199462915819287";
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [id] };

    renderScreen();
    fireEvent.press(screen.getByTestId(`icp-copy-followee-${id}`));

    expect(Clipboard.setString).toHaveBeenCalledWith(id);
  });

  // One row per followee, so a fixed testID would collide and `getBy*` would throw on two.
  it("names each followee's copy control after its own id", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7", "8"] };

    renderScreen();

    expect(screen.getByTestId("icp-copy-followee-7")).toBeVisible();
    expect(screen.getByTestId("icp-copy-followee-8")).toBeVisible();
  });

  // There is no per-followee delete call: removing one means submitting the rest.
  it("submits the remaining followees when one is removed", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: ["7", "8"] };

    renderScreen();
    fireEvent.press(screen.getAllByText("Remove")[0]);

    expect(transaction.followeesIds).toEqual(["8"]);
  });

  it("says the neuron will not vote while the list is empty", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };

    renderScreen();

    expect(screen.getByText(/will not vote on this topic/)).toBeVisible();
  });
});

/*
 * Submitting an empty list is how a topic is cleared, since the canister replaces the whole list per
 * call. Worth allowing, but it is destructive, and the neutral empty-state copy read like a no-op.
 */
describe("Followees clearing a topic", () => {
  beforeEach(() => {
    updateTransaction.mockClear();
  });

  it("says an empty list will stop the neuron following, when it currently follows someone", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n, 99n] }] });

    renderScreen();

    expect(screen.getByText(/stops this neuron following anyone on Governance/)).toBeVisible();
    expect(screen.queryByText(/will not vote on this topic/)).toBeNull();
  });

  it("allows that clearing submission", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE, followeeIds: [42n] }] });

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeEnabled();
  });

  // An empty list over an empty list is a device confirmation that changes nothing.
  it("refuses a submission that would clear nothing", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [] });

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });

  it("counts only the followees on the topic being edited", () => {
    transaction = { type: "follow", followTopic: "Governance", followeesIds: [] };
    neuron = makeHealthyNeuron({ followees: [{ topic: GOVERNANCE + 1, followeeIds: [42n] }] });

    renderScreen();

    expect(screen.getByTestId("icp-continue-button")).toBeDisabled();
  });
});

// A refresh or a disburse drops a neuron from the snapshot, and this screen resolves its neuron live
// out of redux by the id in its route params — so it can lose the neuron with the user standing
// still. Rendering nothing left a blank screen.
describe("Followees without its neuron", () => {
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
