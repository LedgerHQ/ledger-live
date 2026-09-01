import React from "react";
import { render, screen, userEvent, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import ValidatorsListField from "../ValidatorsListField";
import { makeHederaAccount } from "../../../__mocks__/account.mock";
import type { HederaValidatorsQuery } from "@ledgerhq/live-common/families/hedera/react";

let mockValidatorsQuery: HederaValidatorsQuery;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaValidators: () => mockValidatorsQuery,
}));

const defaultState = { settings: AFTER_ONBOARDING_STATE };
const account = makeHederaAccount();
const onChangeValidator = jest.fn();

describe("ValidatorsListField", () => {
  it("shows the fetch error text and keeps the list mounted", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(
      <ValidatorsListField
        account={account}
        selectedValidatorId={null}
        onChangeValidator={onChangeValidator}
      />,
      { initialState: defaultState },
    );

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
    expect(screen.getByTestId("validator-list")).toBeVisible();
  });

  it("hides the search input while the fetch has never succeeded", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(
      <ValidatorsListField
        account={account}
        selectedValidatorId={null}
        onChangeValidator={onChangeValidator}
      />,
      { initialState: defaultState },
    );

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not show an error when the fetch succeeds", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: null };

    render(
      <ValidatorsListField
        account={account}
        selectedValidatorId={null}
        onChangeValidator={onChangeValidator}
      />,
      { initialState: defaultState },
    );

    await waitFor(() => expect(screen.getByTestId("validator-list")).toBeVisible());
    expect(screen.queryByText(/network down/i)).not.toBeInTheDocument();
  });

  it("shows a spinner and no list while the fetch is pending", async () => {
    mockValidatorsQuery = { validators: [], loading: true, error: null };

    render(
      <ValidatorsListField
        account={account}
        selectedValidatorId={null}
        onChangeValidator={onChangeValidator}
      />,
      { initialState: defaultState },
    );

    await waitFor(() => expect(screen.getByTestId("loading-spinner")).toBeVisible());
  });

  it("does not crash clicking 'Show less' with an empty list from a failed fetch", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(
      <ValidatorsListField
        account={account}
        selectedValidatorId={null}
        onChangeValidator={onChangeValidator}
      />,
      { initialState: defaultState },
    );

    await waitFor(() => expect(screen.getByText(/network down/i)).toBeVisible());
    await userEvent.click(screen.getByText(/show less/i));

    expect(screen.getByTestId("validator-list")).toBeVisible();
  });
});
