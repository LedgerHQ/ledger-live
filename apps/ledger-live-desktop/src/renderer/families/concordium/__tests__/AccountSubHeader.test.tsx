import React from "react";
import { render, screen } from "tests/testSetup";
import {
  createFixtureConcordiumAccount,
  createFixtureResources,
} from "@ledgerhq/coin-concordium/bridge/bridge.fixture";
import { PLT_TOKEN_ID, createFixtureTokenAccount } from "@ledgerhq/coin-concordium/test/fixtures";
import type { ConcordiumTokenResources } from "@ledgerhq/live-common/families/concordium/types";
import ConcordiumAccountSubHeader from "../AccountSubHeader";

const tokenAccount = createFixtureTokenAccount();

const parentWith = (state: ConcordiumTokenResources) =>
  createFixtureConcordiumAccount({
    concordiumResources: createFixtureResources({ tokens: { [PLT_TOKEN_ID]: state } }),
  });

// Both the title and the description are pinned: the two carry the state together.
const notices: [string, ConcordiumTokenResources, RegExp, RegExp][] = [
  [
    "paused",
    { transferStatus: "blocked", paused: true },
    /^Transfers are paused for this token$/,
    /paused all transfers/,
  ],
  [
    "notAllowed",
    { transferStatus: "notAllowed" },
    /^This account hasn't been approved to send this token$/,
    /list of approved senders/,
  ],
  [
    "denied",
    { transferStatus: "denied" },
    /^This account is restricted from sending this token$/,
    /has restricted this account/,
  ],
  [
    "unknown",
    { transferStatus: "unknown" },
    /^Token restrictions could not be verified$/,
    /could not be read/,
  ],
  [
    "blocked",
    { transferStatus: "blocked" },
    /^This account cannot send this token$/,
    /restricts who may send/,
  ],
];

describe("ConcordiumAccountSubHeader", () => {
  it.each(notices)("should warn about a %s token", (_label, state, title, description) => {
    render(<ConcordiumAccountSubHeader account={tokenAccount} parentAccount={parentWith(state)} />);

    // Queried per element: the container's text content is the title and the
    // description concatenated, which no anchored regex matches.
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
  });

  it("should render nothing when the issuer allows the account", () => {
    const view = render(
      <ConcordiumAccountSubHeader
        account={tokenAccount}
        parentAccount={parentWith({ transferStatus: "allowed" })}
      />,
    );

    expect(view.container).toBeEmptyDOMElement();
  });

  it("should render nothing for the parent account", () => {
    const parentAccount = parentWith({ transferStatus: "denied" });
    const view = render(
      <ConcordiumAccountSubHeader account={parentAccount} parentAccount={parentAccount} />,
    );

    expect(view.container).toBeEmptyDOMElement();
  });

  // Not reachable from the account page, which resolves the parent first. Pinned
  // because the prop admits it and the send path treats unreadable state the same way.
  it("should warn that nothing could be verified when the parent is missing", () => {
    render(<ConcordiumAccountSubHeader account={tokenAccount} parentAccount={null} />);

    expect(screen.getByText(/^Token restrictions could not be verified$/)).toBeVisible();
  });
});
