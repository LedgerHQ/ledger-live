import React from "react";
import { act, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { useDelegation, useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import ContextMenu from "../ContextMenu";

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useDelegation: jest.fn(),
  useTezosStakingInfo: jest.fn(),
}));

jest.mock("~/renderer/components/DropDownSelector", () => {
  const ReactActual = jest.requireActual("react") as typeof import("react");
  return {
    __esModule: true,
    default: ({
      items,
      renderItem,
    }: {
      items: Array<{ key: string }>;
      renderItem: (args: { item: { key: string } }) => React.ReactNode;
    }) =>
      ReactActual.createElement(
        "div",
        { "data-testid": "dropdown-mock" },
        items.map(item =>
          ReactActual.createElement(ReactActual.Fragment, { key: item.key }, renderItem({ item })),
        ),
      ),
    DropDownItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
      ReactActual.createElement("button", { type: "button", onClick }, children),
  };
});

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");
const account = { ...genAccount("tezos-ctx-test", { currency }) } as unknown as TezosAccount;

const mockedDelegation = jest.mocked(useDelegation);
const mockedStakingInfo = jest.mocked(useTezosStakingInfo);

const defaultDelegation = {
  address: "tz1baker",
  baker: null,
  operation: { hash: "h", date: new Date() },
  isPending: false,
  receiveShouldWarnDelegation: false,
  sendShouldWarnDelegation: false,
};

const stakingInfo = (isStaked: boolean) => ({
  isDelegated: true,
  isStaked,
  stakedBalance: { isZero: () => !isStaked } as never,
  unstakedBalance: { isZero: () => true } as never,
  availableBalance: { isZero: () => false } as never,
  spendableBalance: { isZero: () => false } as never,
  stakingPositions: [],
  unstakingPositions: [],
  totalStaked: { isZero: () => !isStaked } as never,
});

describe("Delegation/ContextMenu (tezos)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDelegation.mockReturnValue(defaultDelegation as never);
    mockedStakingInfo.mockReturnValue(stakingInfo(false) as never);
  });

  describe("when account is not staked", () => {
    it("redelegate item opens MODAL_DELEGATE in redelegate mode", async () => {
      const { user, store } = render(<ContextMenu account={account} stakingEnabled={false} />);

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /Change validator/i }));
      });

      const modals = store.getState().modals;
      expect(modals.MODAL_DELEGATE).toMatchObject({
        isOpened: true,
        data: { eventType: "redelegate", stepId: "summary" },
      });
      expect(modals.MODAL_TEZOS_UNSTAKE_REQUIRED?.isOpened).not.toBe(true);
    });

    it("stopDelegation item opens MODAL_DELEGATE in undelegate mode", async () => {
      const { user, store } = render(<ContextMenu account={account} stakingEnabled={false} />);

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /End delegation/i }));
      });

      const modals = store.getState().modals;
      expect(modals.MODAL_DELEGATE).toMatchObject({
        isOpened: true,
        data: { eventType: "undelegate", mode: "undelegate", stepId: "summary" },
      });
      expect(modals.MODAL_TEZOS_UNSTAKE_REQUIRED?.isOpened).not.toBe(true);
    });
  });

  describe("when account has active staking", () => {
    beforeEach(() => {
      mockedStakingInfo.mockReturnValue(stakingInfo(true) as never);
    });

    it("redelegate item opens MODAL_TEZOS_UNSTAKE_REQUIRED with reason changeBaker", async () => {
      const { user, store } = render(<ContextMenu account={account} stakingEnabled={false} />);

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /Change validator/i }));
      });

      const modals = store.getState().modals;
      expect(modals.MODAL_TEZOS_UNSTAKE_REQUIRED).toMatchObject({
        isOpened: true,
        data: { reason: "changeBaker" },
      });
      expect(modals.MODAL_DELEGATE?.isOpened).not.toBe(true);
    });

    it("stopDelegation item opens MODAL_TEZOS_UNSTAKE_REQUIRED with reason endDelegation", async () => {
      const { user, store } = render(<ContextMenu account={account} stakingEnabled={false} />);

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /End delegation/i }));
      });

      const modals = store.getState().modals;
      expect(modals.MODAL_TEZOS_UNSTAKE_REQUIRED).toMatchObject({
        isOpened: true,
        data: { reason: "endDelegation" },
      });
      expect(modals.MODAL_DELEGATE?.isOpened).not.toBe(true);
    });
  });

  it("topUp item opens MODAL_RECEIVE regardless of staking state", async () => {
    const { user, store } = render(<ContextMenu account={account} stakingEnabled={false} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /Receive more/i }));
    });

    expect(store.getState().modals.MODAL_RECEIVE?.isOpened).toBe(true);
  });

  describe("Stake your XTZ item (lldTezosStaking-gated)", () => {
    it("is hidden when stakingEnabled is false, even when delegated and not staked", () => {
      render(<ContextMenu account={account} stakingEnabled={false} />);
      expect(screen.queryByRole("button", { name: /Stake your XTZ/i })).not.toBeInTheDocument();
    });

    it("is hidden when stakingEnabled but the account is already staked", () => {
      mockedStakingInfo.mockReturnValue(stakingInfo(true) as never);
      render(<ContextMenu account={account} stakingEnabled={true} />);
      expect(screen.queryByRole("button", { name: /Stake your XTZ/i })).not.toBeInTheDocument();
    });

    it("is hidden when stakingEnabled but the account is not delegated", () => {
      mockedStakingInfo.mockReturnValue({ ...stakingInfo(false), isDelegated: false } as never);
      render(<ContextMenu account={account} stakingEnabled={true} />);
      expect(screen.queryByRole("button", { name: /Stake your XTZ/i })).not.toBeInTheDocument();
    });

    it("appears when stakingEnabled, the account is delegated and not yet staked", () => {
      render(<ContextMenu account={account} stakingEnabled={true} />);
      expect(screen.getByRole("button", { name: /Stake your XTZ/i })).toBeInTheDocument();
    });

    it("dispatches MODAL_TEZOS_STAKE with skipDelegation: true when clicked", async () => {
      const { user, store } = render(<ContextMenu account={account} stakingEnabled={true} />);

      await act(async () => {
        await user.click(screen.getByRole("button", { name: /Stake your XTZ/i }));
      });

      expect(store.getState().modals.MODAL_TEZOS_STAKE).toMatchObject({
        isOpened: true,
        data: { skipDelegation: true },
      });
    });
  });
});
