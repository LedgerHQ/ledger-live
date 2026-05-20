import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { useBaker } from "@ledgerhq/live-common/families/tezos/react";
import type { TezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { openURL } from "~/renderer/linking";
import StakingSection from "../StakingSection";

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useBaker: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

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
const account = { ...genAccount("tezos-stake-section", { currency }) } as unknown as TezosAccount;

const mockedUseBaker = jest.mocked(useBaker);

const stakingInfo: TezosStakingInfo = {
  isDelegated: true,
  isStaked: true,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(123_000_000),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(50_000_000),
  delegateAddress: "tz1baker",
  unstakingPositions: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseBaker.mockReturnValue({ address: "tz1baker", name: "Acme Baker" } as never);
});

describe("Delegation/StakingSection (tezos)", () => {
  it("renders the section header and the baker name", () => {
    render(<StakingSection account={account} info={stakingInfo} />);
    expect(screen.getByText(/^Staking$/)).toBeInTheDocument();
    expect(screen.getByText("Acme Baker")).toBeInTheDocument();
  });

  it("renders the staked amount", () => {
    render(<StakingSection account={account} info={stakingInfo} />);
    expect(screen.getByText(/123\s*XTZ/)).toBeInTheDocument();
  });

  it("falls back to a shortened baker address when no baker metadata is available", () => {
    mockedUseBaker.mockReturnValue(undefined as never);
    render(<StakingSection account={account} info={stakingInfo} />);
    expect(screen.getByText(/tz1.+/)).toBeInTheDocument();
  });

  it("Stake more dispatches MODAL_TEZOS_STAKE with skipDelegation: true", async () => {
    const { user, store } = render(<StakingSection account={account} info={stakingInfo} />);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /Stake more/i }));
    });
    expect(store.getState().modals.MODAL_TEZOS_STAKE).toMatchObject({
      isOpened: true,
      data: { skipDelegation: true },
    });
  });

  it("Unstake dispatches MODAL_TEZOS_UNSTAKE", async () => {
    const { user, store } = render(<StakingSection account={account} info={stakingInfo} />);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Unstake$/i }));
    });
    expect(store.getState().modals.MODAL_TEZOS_UNSTAKE).toMatchObject({ isOpened: true });
  });

  it("opens the baker URL on baker-cell click", async () => {
    const { user } = render(<StakingSection account={account} info={stakingInfo} />);
    await user.click(screen.getByText(/Acme Baker/i));
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("tz1baker"));
  });
});
