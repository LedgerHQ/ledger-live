import invariant from "invariant";
import BigNumber from "bignumber.js";
import { act } from "react";
import { renderHook } from "tests/testSetup";
import { makeICPAccount, makeNeuron } from "./testUtils";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

import AccountHeaderManageActions from "../AccountHeaderManageActions";

// MIN_NEURON_STAKE (1 ICP) + ICP_FEES
const ENOUGH_TO_STAKE = new BigNumber(100_010_000);
const NOT_ENOUGH_TO_STAKE = new BigNumber(100_009_999);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AccountHeaderManageActions (internet_computer)", () => {
  const hook = AccountHeaderManageActions;
  invariant(hook, "internet_computer: type guard AccountHeaderManageActions");

  it("returns null when the account has neither stakeable balance nor neurons", () => {
    const account = makeICPAccount({ spendableBalance: NOT_ENOUGH_TO_STAKE });
    const { result } = renderHook(() => hook({ account, parentAccount: null }));
    expect(result.current).toBeNull();
  });

  it("exposes only the Stake action when the balance is sufficient and there are no neurons", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result } = renderHook(() => hook({ account, parentAccount: null }));

    expect(result.current?.map(a => a.key)).toEqual(["Stake"]);
  });

  it("exposes the Manage action once the account has neurons", () => {
    const account = makeICPAccount({
      spendableBalance: ENOUGH_TO_STAKE,
      neurons: [makeNeuron()],
    });
    const { result } = renderHook(() => hook({ account, parentAccount: null }));

    expect(result.current?.map(a => a.key)).toEqual(["Stake", "ManageNeurons"]);
  });

  it("exposes Manage without Stake when neurons exist but the balance is too low", () => {
    const account = makeICPAccount({
      spendableBalance: NOT_ENOUGH_TO_STAKE,
      neurons: [makeNeuron()],
    });
    const { result } = renderHook(() => hook({ account, parentAccount: null }));

    expect(result.current?.map(a => a.key)).toEqual(["ManageNeurons"]);
  });

  it("opens the send flow with a create_neuron transaction when Stake is clicked", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result, store } = renderHook(() => hook({ account, parentAccount: null }));

    act(() => {
      result.current?.[0].onClick();
    });

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      type: "create_neuron",
    });
    expect(store.getState().modals.MODAL_SEND?.isOpened).toBe(true);
  });

  it("opens the neuron list modal when Manage is clicked", () => {
    const account = makeICPAccount({
      spendableBalance: NOT_ENOUGH_TO_STAKE,
      neurons: [makeNeuron()],
    });
    const { result, store } = renderHook(() => hook({ account, parentAccount: null }));

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().modals.MODAL_ICP_LIST_NEURONS?.isOpened).toBe(true);
  });
});
