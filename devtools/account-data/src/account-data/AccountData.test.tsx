import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountData from "./AccountData";
import type { AccountDataToolProps } from "../types";

const now = Date.now();

function renderTool(overrides: Partial<AccountDataToolProps> = {}) {
  const onClearEvents = jest.fn();
  render(
    <AccountData
      statuses={[]}
      events={[]}
      maxAge={30_000}
      onClearEvents={onClearEvents}
      {...overrides}
    />,
  );
  return { onClearEvents };
}

describe("AccountData", () => {
  it("states each read: reading, failed, fresh, stale, never read", () => {
    renderTool({
      statuses: [
        { kind: "balance", accountUUID: "aaaaaaaa-1", reading: "head", hasMore: false },
        { kind: "balance", accountUUID: "bbbbbbbb-1", error: "Error: down", hasMore: false },
        {
          kind: "balance",
          accountUUID: "cccccccc-1",
          readAt: now,
          sourceId: "full-sync",
          hasMore: false,
        },
        { kind: "balance", accountUUID: "dddddddd-1", readAt: now - 60_000, hasMore: true },
        { kind: "operations", accountUUID: "eeeeeeee-1", hasMore: false },
      ],
    });
    for (const state of ["reading", "failed", "fresh", "stale", "never read"]) {
      expect(screen.getByText(state)).toBeVisible();
    }
    expect(screen.getByText("full-sync")).toBeVisible();
  });

  it("lists the events and clears them", async () => {
    const { onClearEvents } = renderTool({
      events: [
        {
          id: 0,
          at: now,
          type: "requested",
          kind: "balance",
          accountUUID: "aaaaaaaa-1",
          requestId: "r1",
          queryKey: "",
          append: false,
        },
        {
          id: 1,
          at: now,
          type: "source-call",
          sourceId: "full-sync",
          kind: "balance",
          batch: false,
          accounts: 1,
          failed: 0,
          elapsedMs: 12,
        },
      ],
    });
    expect(screen.getByText("full-sync.read(balance) 1 account(s) in 12 ms")).toBeVisible();
    expect(screen.getByText(/^balance aaaaaaaa requested/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClearEvents).toHaveBeenCalledTimes(1);
  });
});
