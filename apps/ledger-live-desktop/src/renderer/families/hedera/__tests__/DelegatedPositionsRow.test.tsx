import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import { Row } from "../DelegatedPositions/Row";
import { makeHederaAccount } from "../__mocks__/account.mock";
import { mockEnrichedDelegation } from "../__mocks__/delegation.mock";

const defaultState = { settings: AFTER_ONBOARDING_STATE };
const account = makeHederaAccount();
const onManageAction = jest.fn();
const onExternalLink = jest.fn();

describe("DelegatedPositions Row", () => {
  it("shows a placeholder while loading", () => {
    render(
      <Row
        account={account}
        enrichedDelegation={{ ...mockEnrichedDelegation, loading: true }}
        onManageAction={onManageAction}
        onExternalLink={onExternalLink}
      />,
      { initialState: defaultState },
    );
    expect(screen.queryByText(mockEnrichedDelegation.validator.name)).not.toBeInTheDocument();
  });

  it("hides the validator name and status icon when the fetch failed", () => {
    render(
      <Row
        account={account}
        enrichedDelegation={{ ...mockEnrichedDelegation, error: new Error("failed") }}
        onManageAction={onManageAction}
        onExternalLink={onExternalLink}
      />,
      { initialState: defaultState },
    );
    expect(screen.queryByText(mockEnrichedDelegation.validator.name)).not.toBeInTheDocument();
  });

  it("hides the validator name when the validator has been removed", () => {
    render(
      <Row
        account={account}
        enrichedDelegation={{
          ...mockEnrichedDelegation,
          validator: { ...mockEnrichedDelegation.validator, address: "" },
        }}
        onManageAction={onManageAction}
        onExternalLink={onExternalLink}
      />,
      { initialState: defaultState },
    );
    expect(screen.queryByText(mockEnrichedDelegation.validator.name)).not.toBeInTheDocument();
  });

  it("shows the validator name and status when data is loaded successfully", () => {
    render(
      <Row
        account={account}
        enrichedDelegation={mockEnrichedDelegation}
        onManageAction={onManageAction}
        onExternalLink={onExternalLink}
      />,
      { initialState: defaultState },
    );
    expect(screen.getByText(mockEnrichedDelegation.validator.name)).toBeVisible();
  });

  it("shows an overstaked warning icon when the validator is overstaked", () => {
    render(
      <Row
        account={account}
        enrichedDelegation={{
          ...mockEnrichedDelegation,
          status: HEDERA_DELEGATION_STATUS.Overstaked,
        }}
        onManageAction={onManageAction}
        onExternalLink={onExternalLink}
      />,
      { initialState: defaultState },
    );
    expect(screen.getByText(mockEnrichedDelegation.validator.name)).toBeVisible();
  });

  it("disables the claim rewards action when there is no pending reward", () => {
    render(
      <Row
        account={account}
        enrichedDelegation={{ ...mockEnrichedDelegation, pendingReward: new BigNumber(0) }}
        onManageAction={onManageAction}
        onExternalLink={onExternalLink}
      />,
      { initialState: defaultState },
    );
    expect(screen.getByText(mockEnrichedDelegation.validator.name)).toBeVisible();
  });
});
