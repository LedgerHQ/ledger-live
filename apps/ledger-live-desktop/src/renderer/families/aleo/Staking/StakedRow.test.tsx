import React from "react";
import { render, screen } from "tests/testSetup";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import { openURL } from "~/renderer/linking";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import i18n from "~/renderer/i18n/init";
import { ALEO_BONDED_ACCOUNT } from "../__mocks__/account.mock";
import { bondedPosition } from "../__mocks__/stakingPosition.mock";
import { ALEO_VALIDATOR_ADDRESS } from "../__mocks__/validator.mock";
import StakedRow from "./StakedRow";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("~/renderer/linking", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/linking"),
  openURL: jest.fn(),
}));

// Tippy renders its content lazily on hover, which jsdom makes unreliable. Expose the message on
// the wrapper instead, so the address the user checks against stays assertable.
jest.mock("~/renderer/components/Tooltip", () => ({
  __esModule: true,
  default: ({ content, children }: { content: React.ReactNode; children?: React.ReactNode }) => (
    <div data-tooltip={content == null ? undefined : String(content)}>{children}</div>
  ),
}));

const mockUseAccountUnit = jest.mocked(useAccountUnit);
const mockOpenURL = jest.mocked(openURL);

const renderRow = (
  positionOverrides: Partial<AleoStakingPositionView> = {},
  { discreetMode = false } = {},
) =>
  render(<StakedRow account={ALEO_BONDED_ACCOUNT} position={bondedPosition(positionOverrides)} />, {
    initialState: { settings: { discreetMode } },
  });

describe("StakedRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo", magnitude: 6 });
  });

  it("names the validator and shows what is staked with it", () => {
    renderRow();

    expect(screen.getByText("Figment")).toBeVisible();
    expect(screen.getByText("20 ALEO")).toBeVisible();
  });

  // The device shows the address, not the name, so the row has to offer the address the user is
  // going to compare against — shortened to fit, with the whole thing on hover.
  it("shows the validator address under its name, in full on hover", () => {
    renderRow();

    const sublabel = screen.getByText(shortAddressPreview(ALEO_VALIDATOR_ADDRESS));

    expect(sublabel).toBeVisible();
    expect(sublabel.closest("[data-tooltip]")).toHaveAttribute(
      "data-tooltip",
      ALEO_VALIDATOR_ADDRESS,
    );
  });

  it("opens the validator in the explorer when the row is clicked", async () => {
    const { user } = renderRow();

    await user.click(screen.getByText("Figment"));

    expect(mockOpenURL).toHaveBeenCalledWith(expect.stringContaining(ALEO_VALIDATOR_ADDRESS));
  });

  it("hides the staked amount in discreet mode", () => {
    renderRow({}, { discreetMode: true });

    expect(screen.getByText("***")).toBeVisible();
    expect(screen.queryByText("20 ALEO")).not.toBeInTheDocument();
  });

  describe("when the position records no validator", () => {
    const withoutValidator = { bondedValidator: null, validatorLabel: "" };

    it("says the validator is unknown and offers no address", () => {
      renderRow(withoutValidator);

      expect(screen.getByText(i18n.t("aleo.stake.table.unknownValidator"))).toBeVisible();
      expect(
        screen.queryByText(shortAddressPreview(ALEO_VALIDATOR_ADDRESS)),
      ).not.toBeInTheDocument();
    });

    it("has nothing to open in the explorer", async () => {
      const { user } = renderRow(withoutValidator);

      await user.click(screen.getByText(i18n.t("aleo.stake.table.unknownValidator")));

      expect(mockOpenURL).not.toHaveBeenCalled();
    });
  });

  describe("the estimated rate", () => {
    it("shows the validator's rate as a percentage", () => {
      renderRow();

      expect(
        screen.getByText(i18n.t("aleo.stake.table.estimatedRate", { rate: "6.2" })),
      ).toBeVisible();
    });

    // A non-earning position is forced to exactly 0 by the position hook, which is a real figure
    // and must not collapse into the "we could not work it out" dash.
    it("shows zero for a position that earns nothing", () => {
      renderRow({ estimatedRate: 0, nonEarningReason: "leftCommittee" });

      expect(
        screen.getByText(i18n.t("aleo.stake.table.estimatedRate", { rate: "0.0" })),
      ).toBeVisible();
    });

    it("falls back to a dash when the rate could not be derived", () => {
      renderRow({ estimatedRate: undefined });

      expect(screen.getByText("-")).toBeVisible();
    });
  });
});
