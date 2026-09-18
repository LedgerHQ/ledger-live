import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoNonEarningReason } from "@ledgerhq/live-common/families/aleo/react";
import i18n from "~/renderer/i18n/init";
import StatusIcon from "./StatusIcon";

// Tippy renders its content lazily on hover, which jsdom makes unreliable. The icon only ever
// needs the right message wired to the right reason, so expose that on the wrapper instead.
jest.mock("~/renderer/components/Tooltip", () => ({
  __esModule: true,
  default: ({ content, children }: { content: React.ReactNode; children?: React.ReactNode }) => (
    <div data-testid="tooltip" data-tooltip={content == null ? undefined : String(content)}>
      {children}
    </div>
  ),
}));

const messageFor = (nonEarningReason: AleoNonEarningReason | undefined) => {
  render(<StatusIcon nonEarningReason={nonEarningReason} />);
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
});
