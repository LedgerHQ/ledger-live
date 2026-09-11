import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import ValidatorsSelect from "../ValidatorsSelect";
import { makeHederaAccount } from "../../../__mocks__/account.mock";
import type { HederaValidatorsQuery } from "@ledgerhq/live-common/families/hedera/react";

let mockValidatorsQuery: HederaValidatorsQuery;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaValidators: () => mockValidatorsQuery,
}));

const defaultState = { settings: AFTER_ONBOARDING_STATE };
const account = makeHederaAccount();

describe("ValidatorsSelect", () => {
  it("shows the fetch error text and keeps the select mounted", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(<ValidatorsSelect account={account} selectedValidatorId={null} />, {
      initialState: defaultState,
    });

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
    expect(screen.getByText(/unable to load validators/i)).toBeVisible();
  });

  it("does not show the generic 'select validator' placeholder when the fetch fails", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(<ValidatorsSelect account={account} selectedValidatorId={null} />, {
      initialState: defaultState,
    });

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
    expect(screen.queryByText(/^select validator$/i)).not.toBeInTheDocument();
  });

  it("does not show the removed-validator placeholder when the fetch fails", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(
      <ValidatorsSelect account={account} selectedValidatorId={null} showRemovedPlaceholder />,
      { initialState: defaultState },
    );

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
    expect(
      screen.queryByText(/previously selected validator is no longer available/i),
    ).not.toBeInTheDocument();
  });

  it("does not show an error when the fetch succeeds", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: null };

    render(<ValidatorsSelect account={account} selectedValidatorId={null} />, {
      initialState: defaultState,
    });

    await waitFor(() => expect(screen.queryByText(/network down/i)).not.toBeInTheDocument());
  });

  it("shows the loading placeholder and disables the select while the fetch is pending", async () => {
    mockValidatorsQuery = { validators: [], loading: true, error: null };

    render(<ValidatorsSelect account={account} selectedValidatorId={null} />, {
      initialState: defaultState,
    });

    await waitFor(() => expect(screen.getByText(/loading validators/i)).toBeVisible());
    expect(screen.getByText(/loading validators/i).closest(".select__control")).toHaveClass(
      "select__control--is-disabled",
    );
  });
});
