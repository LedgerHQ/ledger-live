import React from "react";
import BigNumber from "bignumber.js";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Transaction } from "@ledgerhq/live-common/families/tezos/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import TezosSendRowsFee from "../SendRowsFee";
import TezosFeeRow from "../TezosFeeRow";

jest.mock("~/icons/ExternalLink", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return () => <View testID="external-link-icon" />;
});

jest.mock("~/components/CurrencyUnitValue", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return ({ value, unit }: { value: BigNumber; unit: { code: string } }) => (
    <Text testID="currency-unit-value">
      {value.toFixed()} {unit?.code}
    </Text>
  );
});

jest.mock("~/components/CounterValue", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");
  return ({ currency }: { currency: { ticker: string } }) => (
    <Text testID="counter-value">{currency?.ticker}</Text>
  );
});

const tezos = getCryptoCurrencyById("tezos");
const tezosAccount = genAccount("tezos-account-id", { currency: tezos });

const wusdcToken = {
  type: "TokenCurrency" as const,
  id: "tezos/fa2/usdc",
  contractAddress: "KT1",
  parentCurrency: tezos,
  name: "Wrapped USDC",
  ticker: "wUSDC",
  disableCountervalue: false,
  units: [{ name: "wUSDC", code: "wUSDC", magnitude: 6 }],
};

const tokenAccount: TokenAccount = {
  type: "TokenAccount",
  id: "wusdc-sub-account-id",
  parentId: tezosAccount.id,
  token: wusdcToken,
  balance: new BigNumber(1_000_000),
  spendableBalance: new BigNumber(1_000_000),
  creationDate: new Date(),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

const baseTezosTransaction: Transaction = {
  family: "tezos",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
  gasLimit: null,
  storageLimit: null,
  networkInfo: null,
  estimatedFees: null,
  taquitoError: null,
};

const navigationProps = {
  navigation: {} as never,
  route: {} as never,
};

describe("TezosFeeRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when the transaction is not tezos", () => {
    render(
      <TezosFeeRow
        account={tezosAccount}
        transaction={{ family: "bitcoin" } as Transaction}
      />,
    );

    expect(screen.queryByText("Network fees")).toBeNull();
  });

  it("renders native fee currency when sending from a main account", () => {
    const transaction = {
      ...baseTezosTransaction,
      fees: new BigNumber(603),
    };

    render(<TezosFeeRow account={tezosAccount} transaction={transaction} />);

    expect(screen.getByText("Network fees")).toBeTruthy();
    expect(screen.getByTestId("currency-unit-value")).toHaveTextContent("603 XTZ");
    expect(screen.getByTestId("counter-value")).toHaveTextContent("XTZ");
  });

  it("renders native fee currency when sending from a token sub-account", () => {
    const transaction = {
      ...baseTezosTransaction,
      fees: new BigNumber(603),
    };

    render(
      <TezosFeeRow
        account={tokenAccount}
        parentAccount={tezosAccount}
        transaction={transaction}
      />,
    );

    expect(screen.getByText("Network fees")).toBeTruthy();
    expect(screen.getByTestId("currency-unit-value")).toHaveTextContent("603 XTZ");
    expect(screen.getByTestId("counter-value")).toHaveTextContent("XTZ");
  });

  it("renders the fee row without amounts when fees are missing", () => {
    render(<TezosFeeRow account={tezosAccount} transaction={baseTezosTransaction} />);

    expect(screen.getByText("Network fees")).toBeTruthy();
    expect(screen.queryByTestId("currency-unit-value")).toBeNull();
    expect(screen.queryByTestId("counter-value")).toBeNull();
  });

  it("opens the fees info link when the row is pressed", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const transaction = {
      ...baseTezosTransaction,
      fees: new BigNumber(603),
    };

    render(<TezosFeeRow account={tezosAccount} transaction={transaction} />);

    fireEvent.press(screen.getByText("Network fees"));

    expect(openURL).toHaveBeenCalled();
  });
});

describe("TezosSendRowsFee", () => {
  it("returns null for a token account without parent account", () => {
    render(
      <TezosSendRowsFee
        {...navigationProps}
        account={tokenAccount}
        transaction={baseTezosTransaction}
      />,
    );

    expect(screen.queryByText("Network fees")).toBeNull();
  });

  it("renders fees for a token account with parent account", () => {
    const transaction = {
      ...baseTezosTransaction,
      fees: new BigNumber(603),
    };

    render(
      <TezosSendRowsFee
        {...navigationProps}
        account={tokenAccount}
        parentAccount={tezosAccount}
        transaction={transaction}
      />,
    );

    expect(screen.getByTestId("currency-unit-value")).toHaveTextContent("603 XTZ");
  });

  it("renders fees for a main account", () => {
    const transaction = {
      ...baseTezosTransaction,
      fees: new BigNumber(603),
    };

    render(
      <TezosSendRowsFee {...navigationProps} account={tezosAccount} transaction={transaction} />,
    );

    expect(screen.getByTestId("currency-unit-value")).toHaveTextContent("603 XTZ");
  });
});
