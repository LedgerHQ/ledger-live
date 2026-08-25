import invariant from "invariant";
import BigNumber from "bignumber.js";
import { act } from "react";
import { renderHook, withFlagOverrides } from "tests/testSetup";
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

const stakingOn = withFlagOverrides({
  stakePrograms: { enabled: true, params: { list: ["internet_computer"], redirects: {} } },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AccountHeaderManageActions (internet_computer)", () => {
  const hook = AccountHeaderManageActions;
  invariant(hook, "internet_computer: type guard AccountHeaderManageActions");

  const renderActions = (account: ReturnType<typeof makeICPAccount>, initialState = stakingOn) =>
    renderHook(() => hook({ account, parentAccount: null }), { initialState });

  it("returns null when internet_computer is absent from stakePrograms", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result } = renderActions(account, {});

    expect(result.current).toBeNull();
  });

  it("returns null when internet_computer is redirected to a platform app", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result } = renderActions(
      account,
      withFlagOverrides({
        stakePrograms: {
          enabled: true,
          params: {
            list: ["internet_computer"],
            redirects: { internet_computer: { platform: "earn", name: "Earn", queryParams: {} } },
          },
        },
      }),
    );

    expect(result.current).toBeNull();
  });

  it("exposes Manage even when the account holds no neurons", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result } = renderActions(account);

    expect(result.current?.map(a => a.key)).toEqual(["Stake", "ManageNeurons"]);
  });

  it("exposes both actions once the account has neurons", () => {
    const account = makeICPAccount({
      spendableBalance: ENOUGH_TO_STAKE,
      neurons: [makeNeuron()],
    });
    const { result } = renderActions(account);

    expect(result.current?.map(a => a.key)).toEqual(["Stake", "ManageNeurons"]);
  });

  it("drops Stake but keeps Manage when the balance is below the minimum", () => {
    const account = makeICPAccount({ spendableBalance: NOT_ENOUGH_TO_STAKE });
    const { result } = renderActions(account);

    expect(result.current?.map(a => a.key)).toEqual(["ManageNeurons"]);
  });

  it("opens the send flow with a create_neuron transaction when Stake is clicked", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result, store } = renderActions(account);

    act(() => {
      result.current?.find(a => a.key === "Stake")?.onClick();
    });

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      type: "create_neuron",
    });
    expect(store.getState().modals.MODAL_SEND?.isOpened).toBe(true);
  });

  it("returns to the neuron list once the stake is confirmed", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { result, store } = renderActions(account);

    act(() => {
      result.current?.find(a => a.key === "Stake")?.onClick();
    });
    // The store types a closed modal as having no data at all, hence the local shape.
    const sendData = (
      store.getState().modals.MODAL_SEND as
        | { data?: { onConfirmationHandler?: (operation: never) => void } }
        | undefined
    )?.data;
    expect(sendData?.onConfirmationHandler).toBeDefined();

    act(() => {
      sendData?.onConfirmationHandler?.({
        type: "STAKE_NEURON",
        accountId: account.id,
        date: new Date(),
        extra: { createdNeuronId: "42" },
      } as never);
    });

    const listModal = store.getState().modals.MODAL_ICP_LIST_NEURONS as
      | { isOpened?: boolean; data?: { neuronId?: string } }
      | undefined;
    expect(listModal?.isOpened).toBe(true);
    expect(listModal?.data?.neuronId).toBe("42");
  });

  it("opens the neuron list modal when Manage is clicked", () => {
    const account = makeICPAccount({
      spendableBalance: NOT_ENOUGH_TO_STAKE,
      neurons: [makeNeuron()],
    });
    const { result, store } = renderActions(account);

    act(() => {
      result.current?.find(a => a.key === "ManageNeurons")?.onClick();
    });

    expect(store.getState().modals.MODAL_ICP_LIST_NEURONS?.isOpened).toBe(true);
  });
});
