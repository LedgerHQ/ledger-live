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
import { ALEO_BONDED_ACCOUNT } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { bondedPosition } from "../__mocks__/stakingPosition.mock";
import { AleoCustomModal } from "../constants";
import { getAleoCurrencyConfig } from "../shared/utils";

// What the section renders from a position is `Staking/index.test.tsx`'s subject, which mocks only
// the two live-common hooks and so already renders the real summary, row and unstaking table. What
// is left to this file is the wiring the family declares, which no component test can see.
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

describe("Aleo staking section — account page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });
    mockUseAleoUnbondingState.mockReturnValue({
      isClaimable: true,
      isCountingDown: false,
      isSettling: false,
      blocksLeft: 0,
      currentHeight: 1_000,
    });
  });

  // Without the AccountBodyHeader slot the whole feature is simply absent from the account page,
  // and no component test would notice.
  it("reaches the staking table through the family's account body header", async () => {
    await renderAccountBody();

    expect(screen.getByText(i18n.t("aleo.stake.table.header"))).toBeVisible();
    expect(screen.getByText("Figment")).toBeVisible();
  });

  // The section's CTAs dispatch these names; a name the registry does not carry opens nothing at
  // all, and the component tests that pin each dispatch cannot see the registry.
  it.each([AleoCustomModal.CLAIM_UNBOND, AleoCustomModal.MANAGE])(
    "declares the %s modal the section opens",
    async modalName => {
      const family = await importLLDCoinFamily("aleo");

      expect(family.modalsToPreload).toContain(modalName);
    },
  );
});
