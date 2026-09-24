import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoNonEarningReason } from "@ledgerhq/live-common/families/aleo/react";
import i18n from "~/renderer/i18n/init";
import StatusIcon from "./StatusIcon";

jest.mock("~/renderer/components/Tooltip", () => require("../__mocks__/tooltip.mock"));

const renderIcon = (props: Partial<React.ComponentProps<typeof StatusIcon>> = {}) =>
  render(<StatusIcon nonEarningReason={undefined} loading={false} unverified={false} {...props} />);

const messageFor = (nonEarningReason: AleoNonEarningReason | undefined) => {
  renderIcon({ nonEarningReason });
  return screen.getByTestId("tooltip").getAttribute("data-tooltip");
};

describe("StatusIcon", () => {
  it("reports that a position with no impediment is earning", () => {
    expect(messageFor(undefined)).toBe(i18n.t("aleo.stake.status.earningTooltip"));
  });

  // The reasons are interpolated into the key, so the key set and the union are only kept in step
  // by this list: a reason added to `AleoNonEarningReason` with no string would otherwise reach
  // the user as the raw i18n key.
  const REASONS: AleoNonEarningReason[] = [
    "fullCommission",
    "overConcentrated",
    "leftCommittee",
    "ownStakeBelowMinimum",
  ];

  it.each(REASONS)("explains why a %s position earns nothing", reason => {
    const message = messageFor(reason);

    expect(message).toBe(i18n.t(`aleo.stake.nonEarning.${reason}`));
    expect(message).not.toContain("aleo.stake.nonEarning");
  });

  // The position hook returns `nonEarningReason: undefined` when it could not read the committee,
  // precisely because it cannot tell. Reading that as "earning" would promise the user rewards on
  // an answer nothing backs — so these two states must not reach the green tick.
  describe("while the validator list has not been read", () => {
    it("shows a placeholder rather than a status during the first load", () => {
      renderIcon({ loading: true });

      expect(screen.getByTestId("aleo-status-loading")).toBeVisible();
      expect(screen.queryByTestId("tooltip")).not.toBeInTheDocument();
    });

    it("says the status is unavailable when the list failed to load", () => {
      renderIcon({ unverified: true });

      expect(screen.getByTestId("tooltip")).toHaveAttribute(
        "data-tooltip",
        i18n.t("aleo.stake.status.unknown"),
      );
    });
  });

  describe("accessible name", () => {
    it.each([
      [{}, "aleo.stake.status.earningTooltip"],
      [{ unverified: true }, "aleo.stake.status.unknown"],
      [
        { nonEarningReason: "leftCommittee" as const },
        "aleo.stake.nonEarning.leftCommittee" as const,
      ],
    ])("names the status for a screen reader (%o)", (props, expectedKey) => {
      renderIcon(props);

      expect(screen.getByRole("img", { name: i18n.t(expectedKey) })).toBeInTheDocument();
    });
  });
});
