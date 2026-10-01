import React from "react";
import BigNumber from "bignumber.js";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import type { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { ScreenName } from "~/const";
import DelegationSummary from "../02-Summary";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: () => ({
    colors: { background: "#fff", primary: "#6490f1", border: "#eee", text: "#000" },
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/families/cosmos/react");
jest.mock("LLM/hooks/useAccountScreen");
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));

type Props = React.ComponentProps<typeof DelegationSummary>;

const route = {
  key: "k",
  name: ScreenName.CosmosDelegationValidator,
  params: { accountId: "acc" },
} as unknown as Props["route"];
const navigation = { navigate: jest.fn() } as unknown as Props["navigation"];

const makeValidator = (index: number): CosmosValidatorItem => ({
  validatorAddress: `validator-address-${index}`,
  name: `Validator ${index}`,
  votingPower: 1,
  commission: 0.05,
  estimatedYearlyRewardsRate: 0.1,
  tokens: "1000000",
});

function renderSummary(currencyId: string) {
  const currency = getCryptoCurrencyById(currencyId);
  jest.mocked(useAccountScreen).mockReturnValue({
    account: genAccount(`${currencyId}-test`, { currency }),
    parentAccount: undefined,
  });
  jest.mocked(useBridgeTransaction).mockReturnValue({
    transaction: { family: "cosmos", mode: "delegate", validators: [], amount: BigNumber(0) },
    status: { errors: {}, warnings: {} },
    updateTransaction: jest.fn(),
    setTransaction: jest.fn(),
    bridgePending: false,
    bridgeError: null,
  } as unknown as ReturnType<typeof useBridgeTransaction>);
  jest
    .mocked(useLedgerFirstShuffledValidatorsCosmosFamily)
    .mockReturnValue([makeValidator(0), makeValidator(1)]);

  render(<DelegationSummary navigation={navigation} route={route} />);
}

describe("Cosmos DelegationFlow Summary", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should pre-select the first validator when the chain is cosmos", () => {
    renderSummary("cosmos");

    expect(screen.getByTestId("cosmos-delegation-summary-validator")).toHaveTextContent(
      /^Validator 0$/,
    );
  });

  it("should leave the validator unset when the chain is babylon", () => {
    renderSummary("babylon");

    expect(screen.getByTestId("cosmos-delegation-summary-validator")).toHaveTextContent(/^-$/);
  });
});
