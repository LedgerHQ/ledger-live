import React from "react";
import BigNumber from "bignumber.js";
import { act, render, renderHook, screen, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { listSolanaStakingPositions } from "@ledgerhq/live-common/families/solana/logic";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { StakingDelegation, StakingResources, StakingUnbonding } from "@ledgerhq/types-live";
import { abandonStakePosition, useShownStakePosition } from "@features/flow-stake-position";
import Delegations from ".";

type DropDownItemShape = { key: string; label: React.ReactNode };

// The menu opens in a tooltip: each item is a button here, in the menu's order.
jest.mock("~/renderer/components/DropDownSelector", () => {
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  return {
    __esModule: true,
    default: ({
      items,
      renderItem,
      onChange,
    }: {
      items: DropDownItemShape[];
      renderItem: (args: { item: DropDownItemShape; isActive: boolean }) => React.ReactNode;
      onChange: (item: DropDownItemShape) => void;
    }) =>
      ReactActual.createElement(
        "div",
        { role: "menu" },
        items.map(item =>
          ReactActual.createElement(
            "button",
            { type: "button", key: item.key, role: "menuitem", onClick: () => onChange(item) },
            renderItem({ item, isActive: false }),
          ),
        ),
      ),
    DropDownItem: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement("div", null, children),
  };
});

jest.mock("@ledgerhq/live-common/families/solana/react", () => ({
  useSolanaStakesWithMeta: (_currency: unknown, resources: StakingResources | undefined) =>
    listSolanaStakingPositions(resources).map(stake => ({ stake, meta: {} })),
}));

const SOL = 1_000_000_000;
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";

const delegation: StakingDelegation = {
  positionId: STAKE_ACCOUNT,
  validatorAddress: "FakeVote1111111111111111111111111111111111",
  amount: new BigNumber(2 * SOL),
  activeAmount: new BigNumber(2 * SOL),
  inactiveAmount: new BigNumber(0),
  withdrawableAmount: new BigNumber(0),
  pendingRewards: new BigNumber(0),
  status: "bonded",
};

const deactivating: StakingUnbonding = {
  positionId: "FakeStake222222222222222222222222222222222",
  validatorAddress: "FakeVote1111111111111111111111111111111111",
  amount: new BigNumber(SOL),
  withdrawableAmount: new BigNumber(0),
  completionDate: new Date(0),
  status: "deactivating",
};

function solanaAccount(currencyId = "solana"): SolanaAccount {
  return {
    ...genAccount(`solana-delegations-${currencyId}`, {
      currency: getCryptoCurrencyById(currencyId),
      operationsSize: 0,
    }),
    stakingResources: {
      delegations: [delegation],
      redelegations: [],
      unbondings: [deactivating],
      delegatedBalance: new BigNumber(2 * SOL),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(SOL),
    },
  };
}

const ACCOUNT_PAGE_ON = withFlagOverrides({
  earnNativeStakePosition: { enabled: true, params: { accountPage: true } },
});

function renderDelegations(
  account: SolanaAccount,
  initialState: ReturnType<typeof withFlagOverrides> = ACCOUNT_PAGE_ON,
) {
  const view = render(<Delegations account={account} />, { initialState });
  const shown = renderHook(() => useShownStakePosition(), { store: view.store });
  return { ...view, shown };
}

const menusItems = () =>
  screen
    .getAllByRole("menu")
    .map(menu => Array.from(menu.querySelectorAll("[role=menuitem]"), item => item.textContent));

describe("solana Delegations", () => {
  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const { request } = result.current;
    if (request) act(() => abandonStakePosition(request.id));
    unmount();
  });

  it("lists View details first on every row, once the flag opens the account page entry", () => {
    renderDelegations(solanaAccount());

    expect(menusItems()).toEqual([
      ["View details", "Deactivate"],
      ["View details", "Reactivate"],
    ]);
  });

  it("opens the position in the stake position dialog, from the account page", async () => {
    const account = solanaAccount();
    const { shown, store, user } = renderDelegations(account);

    const [viewDetails] = screen.getAllByRole("menuitem", { name: "View details" });
    await user.click(viewDetails);

    expect(shown.result.current.request).toMatchObject({
      origin: "account",
      accountId: account.id,
      positionId: STAKE_ACCOUNT,
    });
    expect(store.getState().modals.MODAL_SOLANA_DELEGATION_DEACTIVATE?.isOpened).not.toBe(true);
  });

  it("keeps the legacy modal of Reactivate", async () => {
    const { store, user } = renderDelegations(solanaAccount());

    await user.click(screen.getByRole("menuitem", { name: "Reactivate" }));

    expect(store.getState().modals.MODAL_SOLANA_DELEGATION_REACTIVATE).toMatchObject({
      isOpened: true,
    });
  });

  it.each([
    ["the flag is off", withFlagOverrides({ earnNativeStakePosition: { enabled: false } })],
    [
      "the flag opens Earn only, as its existing values do",
      withFlagOverrides({ earnNativeStakePosition: { enabled: true } }),
    ],
    [
      "the account page param is off",
      withFlagOverrides({
        earnNativeStakePosition: { enabled: true, params: { accountPage: false } },
      }),
    ],
  ])("lists no View details when %s", (_case, initialState) => {
    renderDelegations(solanaAccount(), initialState);

    expect(screen.queryByRole("menuitem", { name: "View details" })).not.toBeInTheDocument();
  });

  it("lists no View details on a test network", () => {
    renderDelegations(solanaAccount("solana_devnet"));

    expect(screen.queryByRole("menuitem", { name: "View details" })).not.toBeInTheDocument();
  });
});
