import React from "react";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import BondPublicFlowModal from "../BondPublicFlowModal";
import { DEFAULT_ALEO_VALIDATOR } from "../constants";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { mockSignedOperation } from "../__mocks__/signedOperation.mock";
import { getAleoCurrencyConfig } from "../shared/utils";
import { initSendSubjects, subjectRefs, prepareTransactionSpy } from "../__mocks__/bridge.mock";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";

jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/react"),
  useAleoValidators: jest.fn(),
}));

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => {
    const { mockAppState, mockDevice } = require("../__mocks__/bridge.mock");
    return {
      useHook: () => mockAppState,
      mapResult: () => ({ device: mockDevice }),
    };
  },
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  __esModule: true,
  getAccountBridge: () => require("../__mocks__/bridge.mock").resolvedAccountBridge,
  getCurrencyBridge: () => require("../__mocks__/bridge.mock").resolvedCurrencyBridge,
}));

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);
const mockUseAleoValidators = jest.mocked(useAleoValidators);

// Open, not unbonding and earning: give any of a closed flag, an unbonding flag or a
// non-earning reason and the rows below get demoted and re-sorted, silently changing what
// the assertions mean.
const FIGMENT = {
  address: DEFAULT_ALEO_VALIDATOR.mainnet,
  name: "Figment",
  stakeMicrocredits: 63_051_013_000_000,
  isOpen: true,
  isUnbonding: false,
  commissionPercent: 10,
  estimatedYearlyRewardsRate: 0.062,
};
const OTHER = {
  address: "aleo1vfukg8ky2mhfprw63000000000000000000000000000000000000000q",
  name: "Other Validator",
  stakeMicrocredits: 162_243_084_000_000,
  isOpen: true,
  isUnbonding: false,
  commissionPercent: 10,
  estimatedYearlyRewardsRate: 0.061,
};

beforeEach(async () => {
  mockDomMeasurements();
  await importLLDCoinFamily("aleo");
  initSendSubjects();
  prepareTransactionSpy.mockClear();
  mockGetAleoCurrencyConfig.mockReturnValue(mockAleoCoinConfig);
  // Deliberately listed with Figment second, so a passing assertion cannot be an
  // artifact of it happening to be first.
  mockUseAleoValidators.mockReturnValue({
    validators: [OTHER, FIGMENT],
    loading: false,
    error: null,
  });
});

afterEach(() => {
  subjectRefs.sync.complete();
  subjectRefs.sign.complete();
  document.getElementById("modals")?.remove();
});

function setupModal(account = ALEO_MAIN_ACCOUNT) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<BondPublicFlowModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_ALEO_BOND_PUBLIC: {
          isOpened: true,
          data: { account, parentAccount: null },
        },
      },
    },
  });
}

async function clickContinueWhenEnabled() {
  const button = () => screen.getByRole("button", { name: "Continue" });
  await waitFor(() => expect(button()).not.toBeDisabled());
  await userEvent.click(button());
}

// Selection hangs off the row. The name is the explorer link and deliberately selects
// nothing, so tests that mean to select must target the row.
async function clickValidatorRow(name: string) {
  const row = (await screen.findByText(name)).closest("[data-testid='modal-provider-row']");
  await userEvent.click(row as HTMLElement);
}

describe("Aleo bond flow — full modal", () => {
  it("bonds through validator → amount → device → success", async () => {
    setupModal();

    await screen.findByTestId("selected-validator");
    await clickContinueWhenEnabled();

    expect(await screen.findByText(/must reach at least 10,000 ALEO/)).toBeInTheDocument();
    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
    });

    await waitFor(() => expect(screen.getByText("Bond sent")).toBeInTheDocument(), {
      timeout: 5000,
    });
  }, 20000);

  // The withdrawal address is never a step: it is pinned to the user's own account at
  // transaction-creation time, and nothing downstream re-pins it.
  it("seeds the withdrawal address from the account's fresh address", async () => {
    setupModal();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());

    const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
    expect(transaction).toMatchObject({ withdrawal: ALEO_MAIN_ACCOUNT.freshAddress });
  });

  it("keeps the withdrawal address pinned after the validator is changed", async () => {
    setupModal();

    await clickValidatorRow("Other Validator");

    await waitFor(() => {
      const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
      expect(transaction).toMatchObject({
        recipient: OTHER.address,
        withdrawal: ALEO_MAIN_ACCOUNT.freshAddress,
      });
    });
  });
});

describe("Aleo bond flow — validator pre-selection", () => {
  it("seeds the transaction with the default validator when nothing is bonded", async () => {
    setupModal();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());

    const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
    expect(transaction.recipient).toBe(DEFAULT_ALEO_VALIDATOR.mainnet);
    expect(transaction.mode).toBe("bond_public");
  });

  it("seeds the testnet default validator on testnet", async () => {
    mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, networkType: "testnet" });

    setupModal();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());

    const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
    expect(transaction.recipient).toBe(DEFAULT_ALEO_VALIDATOR.testnet);
    expect(transaction.recipient).not.toBe(DEFAULT_ALEO_VALIDATOR.mainnet);
  });

  it("seeds nothing when the network cannot be resolved", async () => {
    mockGetAleoCurrencyConfig.mockReturnValue(undefined);

    setupModal();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());

    const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
    expect(transaction.recipient).toBe("");
  });

  it("seeds the bonded validator instead of the default when a position is open", async () => {
    const bonded = {
      ...ALEO_MAIN_ACCOUNT,
      aleoResources: {
        ...ALEO_MAIN_ACCOUNT.aleoResources,
        bondedValidator: OTHER.address,
      },
    };

    setupModal(bonded as typeof ALEO_MAIN_ACCOUNT);

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());

    const [, transaction] = prepareTransactionSpy.mock.calls.at(-1)!;
    expect(transaction.recipient).toBe(OTHER.address);
  });

  it("renders the default validator in the list so the selection is visible", async () => {
    setupModal();

    await waitFor(() => expect(screen.getByText("Figment")).toBeVisible());
  });

  // The shared ValidatorRow derives its highlight from a voting `value` this picker never
  // passes, so a correctly seeded recipient can still render as though nothing were chosen.
  it("marks the pre-selected row as selected in the DOM", async () => {
    setupModal();

    const selected = await screen.findByTestId("selected-validator");
    expect(selected).toHaveTextContent("Figment");
  });
});

// `bond_public` asserts the validator has no `unbonding` entry, so bonding to one that
// does always fails on-chain — however open the committee still reports it.
describe("Aleo bond flow — a validator that is itself unbonding", () => {
  beforeEach(() => {
    mockUseAleoValidators.mockReturnValue({
      validators: [{ ...OTHER, isUnbonding: true }, FIGMENT],
      loading: false,
      error: null,
    });
  });

  it("says so on the row, rather than leaving it looking bondable", async () => {
    setupModal();

    expect(await screen.findByText("Validator is unbonding")).toBeVisible();
  });

  it("does not let it be selected", async () => {
    setupModal();

    await clickValidatorRow("Other Validator");

    expect(await screen.findByTestId("selected-validator")).toHaveTextContent("Figment");
    expect(prepareTransactionSpy.mock.calls.at(-1)![1].recipient).toBe(FIGMENT.address);
  });
});

// The default is seeded before the list loads, so it can land on a row the list then
// refuses to select. Left alone that opens the flow on an error the user cannot clear.
describe("Aleo bond flow — a default that turns out to be unpickable", () => {
  const seedDefaultAs = (state: Partial<AleoValidator>) =>
    mockUseAleoValidators.mockReturnValue({
      validators: [OTHER, { ...FIGMENT, ...state }],
      loading: false,
      error: null,
    });

  it.each<[string, Partial<AleoValidator>]>([
    ["unbonding", { isUnbonding: true }],
    ["closed", { isOpen: false }],
    ["over the concentration cap", { nonEarningReason: "overConcentrated" }],
  ])("moves off a default that is %s", async (_label, state) => {
    seedDefaultAs(state);

    setupModal();

    await waitFor(() =>
      expect(prepareTransactionSpy.mock.calls.at(-1)![1].recipient).toBe(OTHER.address),
    );
    expect(await screen.findByTestId("selected-validator")).toHaveTextContent("Other Validator");
  });

  it("leaves the selection alone when no validator accepts stake", async () => {
    mockUseAleoValidators.mockReturnValue({
      validators: [
        { ...OTHER, isUnbonding: true },
        { ...FIGMENT, isUnbonding: true },
      ],
      loading: false,
      error: null,
    });

    setupModal();

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());
    expect(prepareTransactionSpy.mock.calls.at(-1)![1].recipient).toBe(FIGMENT.address);
  });

  it("keeps a bonded validator that is unbonding, rather than switching away from it", async () => {
    mockUseAleoValidators.mockReturnValue({
      validators: [OTHER, { ...FIGMENT, isUnbonding: true }],
      loading: false,
      error: null,
    });
    const bonded = {
      ...ALEO_MAIN_ACCOUNT,
      aleoResources: {
        ...ALEO_MAIN_ACCOUNT.aleoResources,
        bondedValidator: FIGMENT.address,
      },
    };

    setupModal(bonded as typeof ALEO_MAIN_ACCOUNT);

    await waitFor(() => expect(prepareTransactionSpy).toHaveBeenCalled());
    expect(prepareTransactionSpy.mock.calls.at(-1)![1].recipient).toBe(FIGMENT.address);
  });
});
