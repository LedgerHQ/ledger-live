import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import ValidatorPicker from "./ValidatorPicker";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/react"),
  useAleoValidators: jest.fn(),
}));

const mockUseAleoValidators = jest.mocked(useAleoValidators);

const FIGMENT: AleoValidator = {
  address: "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t",
  name: "Figment",
  stakeMicrocredits: 63_051_013_000_000,
  isOpen: true,
  isUnbonding: false,
  commissionPercent: 10,
  estimatedYearlyRewardsRate: 0.062,
} as AleoValidator;

const OTHER: AleoValidator = {
  ...FIGMENT,
  address: "aleo1vfukg8ky2mhfprw63000000000000000000000000000000000000000q",
  name: "Other Validator",
  stakeMicrocredits: 162_243_084_000_000,
} as AleoValidator;

const setValidators = (
  validators: AleoValidator[],
  extra: { loading?: boolean; error?: Error | null } = {},
) =>
  mockUseAleoValidators.mockReturnValue({
    validators,
    loading: false,
    error: null,
    ...extra,
  });

beforeEach(() => {
  mockDomMeasurements();
  setValidators([FIGMENT, OTHER]);
});

function setup(props: Partial<React.ComponentProps<typeof ValidatorPicker>> = {}) {
  const onSelect = jest.fn();
  const onRetry = jest.fn();
  const utils = render(
    <ValidatorPicker
      currency={ALEO_MAIN_ACCOUNT.currency}
      selected={FIGMENT.address}
      lockedTo={null}
      onSelect={onSelect}
      onRetry={onRetry}
      {...props}
    />,
    { initialState: { settings: AFTER_ONBOARDING_STATE } },
  );

  return { ...utils, onSelect, onRetry };
}

describe("ValidatorPicker — list states", () => {
  it("spins while the first load is still in flight", () => {
    setValidators([], { loading: true });

    setup();

    expect(screen.getByTestId("validator-list-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("validator-list")).not.toBeInTheDocument();
  });

  it("shows the list rather than the spinner once a stale list exists", () => {
    setValidators([FIGMENT], { loading: true });

    setup();

    expect(screen.queryByTestId("validator-list-loading")).not.toBeInTheDocument();
    expect(screen.getByTestId("validator-list")).toBeInTheDocument();
  });

  it("offers a retry when the fetch failed with nothing to show", async () => {
    setValidators([], { error: new Error("boom") });

    const { onRetry } = setup();

    expect(screen.getByTestId("validator-fetch-error")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // A stale list is more useful than an error screen, so an error alongside one is ignored.
  it("keeps showing a stale list when the refresh failed", () => {
    setValidators([FIGMENT], { error: new Error("boom") });

    setup();

    expect(screen.queryByTestId("validator-fetch-error")).not.toBeInTheDocument();
    expect(screen.getByText("Figment")).toBeInTheDocument();
  });
});

describe("ValidatorPicker — search", () => {
  it("filters by name, case-insensitively", async () => {
    setup();

    await userEvent.type(screen.getByPlaceholderText("Search by name or address..."), "other");

    expect(screen.getByText("Other Validator")).toBeInTheDocument();
    expect(screen.queryByText("Figment")).not.toBeInTheDocument();
  });

  it("filters by address", async () => {
    setup();

    await userEvent.type(
      screen.getByPlaceholderText("Search by name or address..."),
      OTHER.address,
    );

    expect(screen.getByText("Other Validator")).toBeInTheDocument();
    expect(screen.queryByText("Figment")).not.toBeInTheDocument();
  });

  it("shows a no-result placeholder and hides the show-all toggle", async () => {
    setup();

    await userEvent.type(screen.getByPlaceholderText("Search by name or address..."), "zzzz");

    expect(screen.queryByText("Figment")).not.toBeInTheDocument();
    expect(screen.queryByText("Show less")).not.toBeInTheDocument();
    expect(screen.queryByText("Show all")).not.toBeInTheDocument();
  });
});

describe("ValidatorPicker — show all toggle", () => {
  it("starts expanded and collapses to the selected row alone", async () => {
    setup();

    expect(screen.getByText("Other Validator")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Show less"));

    expect(screen.getByText("Figment")).toBeInTheDocument();
    expect(screen.queryByText("Other Validator")).not.toBeInTheDocument();
  });

  it("re-expands on a second click", async () => {
    setup();

    await userEvent.click(screen.getByText("Show less"));
    await userEvent.click(screen.getByText("Show all"));

    expect(screen.getByText("Other Validator")).toBeInTheDocument();
  });
});

describe("ValidatorPicker — locked to a bonded validator", () => {
  it("shows that validator alone, with no search and no toggle", () => {
    setup({ lockedTo: OTHER.address });

    expect(screen.getByTestId("bonded-validator")).toHaveTextContent("Other Validator");
    expect(screen.queryByText("Figment")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by name or address...")).not.toBeInTheDocument();
    expect(screen.queryByText("Show less")).not.toBeInTheDocument();
  });

  // The bonded validator can have left the committee, so it need not be in the list at all.
  it("falls back to the shortened address when the list does not carry it", () => {
    setup({ lockedTo: "aleo1notinthelist000000000000000000000000000000000000000000000" });

    expect(screen.getByTestId("bonded-validator")).toHaveTextContent("aleo1not...00000000");
  });

  it("does not auto-move off a locked validator that is unpickable", () => {
    setValidators([{ ...OTHER, isUnbonding: true }, FIGMENT]);

    const { onSelect } = setup({ lockedTo: OTHER.address, selected: OTHER.address });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
