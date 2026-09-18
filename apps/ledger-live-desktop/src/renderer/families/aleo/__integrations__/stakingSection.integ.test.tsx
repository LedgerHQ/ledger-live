import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import {
  useAleoStakingPosition,
  useAleoUnbondingState,
  type AleoStakingPositionView,
} from "@ledgerhq/live-common/families/aleo/react";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import i18n from "~/renderer/i18n/init";
import {
  ALEO_BONDED_ACCOUNT,
  ALEO_BONDED_CLAIMABLE_ACCOUNT,
  ALEO_MAIN_ACCOUNT,
} from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import {
  aleoStakingPosition,
  bondedPosition,
  bondedUnbondingPosition,
} from "../__mocks__/stakingPosition.mock";
import { AleoCustomModal } from "../constants";
import { getAleoCurrencyConfig } from "../shared/utils";

// The position and the unbonding countdown are live-common's, tested there against the chain reads
// they derive from. This is the app side of that boundary: the family slot, and the whole section
// composing from one position.
jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoStakingPosition: jest.fn(),
  useAleoUnbondingState: jest.fn(),
}));

jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

const mockUseAleoStakingPosition = jest.mocked(useAleoStakingPosition);
const mockUseAleoUnbondingState = jest.mocked(useAleoUnbondingState);
const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

/** Renders the section the way the account page does: through the family's own slot. */
const renderAccountBody = async (
  account: AleoAccount = ALEO_BONDED_ACCOUNT,
  position: AleoStakingPositionView = bondedPosition(),
) => {
  mockUseAleoStakingPosition.mockReturnValue(position);

  const { AccountBodyHeader } = await importLLDCoinFamily("aleo");

  if (!AccountBodyHeader) throw new Error("the aleo family exposes no AccountBodyHeader");

  return render(<AccountBodyHeader account={account} parentAccount={null} />, {
    initialState: { settings: AFTER_ONBOARDING_STATE },
  });
};

const unstakingTable = () =>
  screen.queryByText(i18n.t("aleo.stake.unstaking.header"), {
    selector: '[data-e2e="title_Unstaking"]',
  });

describe("Aleo staking section — account page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });
    mockUseAleoUnbondingState.mockReturnValue({
      isClaimable: true,
      isCountingDown: false,
      isSettling: false,
      blocksLeft: 0,
    });
  });

  // Without the AccountBodyHeader slot the whole feature is simply absent from the account page,
  // and no component test would notice.
  it("reaches the staking table through the family's account body header", async () => {
    await renderAccountBody();

    expect(screen.getByText(i18n.t("aleo.stake.table.header"))).toBeVisible();
    expect(screen.getByText("Figment")).toBeVisible();
  });

  it("stays out of the account page while staking is disabled", async () => {
    mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: false });

    const { container } = await renderAccountBody();

    expect(container).toBeEmptyDOMElement();
  });

  // One position drives the summary, the staked row and the unstaking table at once. A field the
  // hook renamed would show up here as a figure going missing from one of the three.
  it("composes the summary, the staked row and the unstaking table from one position", async () => {
    await renderAccountBody(ALEO_BONDED_CLAIMABLE_ACCOUNT, bondedUnbondingPosition());

    expect(screen.getByTestId("aleo-staked-balance")).toHaveTextContent("20 ALEO");
    expect(screen.getByTestId("aleo-unstaking-balance")).toHaveTextContent("3 ALEO");
    expect(screen.getByTestId("aleo-claimable-balance")).toHaveTextContent("2 ALEO");
    expect(screen.getByText("Figment")).toBeVisible();
    expect(unstakingTable()).toBeVisible();
    expect(screen.getByTestId("aleo-claim-cta")).toBeVisible();
  });

  it("offers the staking entry point on an account with no position", async () => {
    await renderAccountBody(ALEO_MAIN_ACCOUNT, aleoStakingPosition());

    expect(
      screen.getByRole("button", { name: i18n.t("aleo.stake.emptyState.earnRewards") }),
    ).toBeVisible();
    expect(unstakingTable()).not.toBeInTheDocument();
  });

  // Both tables reach the same modal registry the family declares in `modalsToPreload`, so a CTA
  // wired to a name the registry does not carry would open nothing at all.
  it.each([
    ["claim", "aleo-claim-cta", AleoCustomModal.CLAIM_UNBOND],
    ["manage", undefined, AleoCustomModal.MANAGE],
  ])("opens the %s modal the family declares", async (_label, testId, modalName) => {
    const { store, user } = await renderAccountBody(
      ALEO_BONDED_CLAIMABLE_ACCOUNT,
      bondedUnbondingPosition(),
    );

    await user.click(
      testId
        ? screen.getByTestId(testId)
        : screen.getByRole("button", { name: i18n.t("aleo.stake.table.manage") }),
    );

    const { AccountBodyHeader: _, ...family } = await importLLDCoinFamily("aleo");

    expect(store.getState().modals[modalName]).toEqual({
      isOpened: true,
      data: { account: ALEO_BONDED_CLAIMABLE_ACCOUNT },
    });
    expect(family.modalsToPreload).toContain(modalName);
  });
});
