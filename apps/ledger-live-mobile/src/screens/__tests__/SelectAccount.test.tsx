import React from "react";
import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { render, screen } from "@tests/test-renderer";
import SelectAccount from "../SelectAccount";
import type { State } from "~/reducers/types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  const { defaultIsAccountEmpty } = jest.requireActual(
    "@ledgerhq/live-common/bridge/defaultBridgeExtensions",
  );
  return {
    useAccountBridge: jest.fn(),
    useAccountBridgeOrNull: jest.fn(),
    useAccountBridgeMany: jest.fn((accounts: Account[]) =>
      accounts.map(() => ({ isAccountEmpty: defaultIsAccountEmpty })),
    ),
  };
});

jest.mock("~/components/AccountSelector", () => {
  const { View, Text } = jest.requireActual("react-native");
  return function MockAccountSelector({ list }: { list: AccountLike[] }) {
    return (
      <View testID="account-selector">
        {list.map(a => (
          <Text key={a.id} testID={`account-${a.id}`}>
            {a.id}
          </Text>
        ))}
      </View>
    );
  };
});

jest.mock("LLM/features/Send/hooks/useNewSendFlowFeature", () => ({
  useNewSendFlowFeature: () => ({
    isEnabledForFamily: () => false,
    getFamilyFromAccount: () => "ethereum",
    getCurrencyIdFromAccount: () => "ethereum",
  }),
}));

setSupportedCurrencies(["ethereum", "polygon"]);

const ethereum = getCryptoCurrencyById("ethereum");
const polygon = getCryptoCurrencyById("polygon");
const usdc = { parentCurrency: ethereum } as unknown as TokenCurrency;
const usdtEth = { id: "ethereum/erc20/usdt", parentCurrency: ethereum } as unknown as TokenCurrency;
const usdtPoly = { id: "polygon/erc20/usdt", parentCurrency: polygon } as unknown as TokenCurrency;

const EMPTY_ETH = genAccount("sa-empty-eth", {
  currency: ethereum,
  operationsSize: 0,
  subAccountsCount: 0,
});
const FUNDED_ETH = genAccount("sa-funded-eth", {
  currency: ethereum,
  operationsSize: 5,
  subAccountsCount: 0,
});
const FUNDED_TOKEN = genTokenAccount(0, FUNDED_ETH, usdc);

const ETH_PARENT = genAccount("sa-eth-parent", {
  currency: ethereum,
  operationsSize: 5,
  subAccountsCount: 0,
});
const POLY_PARENT = genAccount("sa-poly-parent", {
  currency: polygon,
  operationsSize: 5,
  subAccountsCount: 0,
});
const USDT_ETH = genTokenAccount(0, ETH_PARENT, usdtEth);
const USDT_POLY = genTokenAccount(0, POLY_PARENT, usdtPoly);

function makeRoute(params: Record<string, unknown> = {}) {
  return {
    key: "SendCoin-key",
    name: "SendCoin" as const,
    params: { category: "test", ...params },
  };
}

function makeNavigation() {
  return {
    navigate: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    setOptions: jest.fn(),
    getParent: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
  };
}

const withAccounts =
  (accounts: Account[]) =>
  (state: State): State => ({
    ...state,
    accounts: { active: accounts },
  });

describe("SelectAccount — notEmptyAccounts filter via bridge", () => {
  it("filters out accounts whose bridge reports empty when notEmptyAccounts is true", () => {
    render(
      <SelectAccount
        // oxlint-disable-next-line typescript/no-explicit-any
        navigation={makeNavigation() as any}
        // oxlint-disable-next-line typescript/no-explicit-any
        route={makeRoute({ notEmptyAccounts: true }) as any}
      />,
      { overrideInitialState: withAccounts([EMPTY_ETH, FUNDED_ETH]) },
    );

    expect(screen.queryByTestId(`account-${EMPTY_ETH.id}`)).toBeNull();
    expect(screen.queryByTestId(`account-${FUNDED_ETH.id}`)).not.toBeNull();
  });

  it("keeps all accounts when notEmptyAccounts is not set", () => {
    render(
      <SelectAccount
        // oxlint-disable-next-line typescript/no-explicit-any
        navigation={makeNavigation() as any}
        // oxlint-disable-next-line typescript/no-explicit-any
        route={makeRoute() as any}
      />,
      { overrideInitialState: withAccounts([EMPTY_ETH, FUNDED_ETH]) },
    );

    expect(screen.queryByTestId(`account-${EMPTY_ETH.id}`)).not.toBeNull();
    expect(screen.queryByTestId(`account-${FUNDED_ETH.id}`)).not.toBeNull();
  });

  it("resolves a TokenAccount's bridge via its parent Account when filtering", () => {
    render(
      <SelectAccount
        // oxlint-disable-next-line typescript/no-explicit-any
        navigation={makeNavigation() as any}
        // oxlint-disable-next-line typescript/no-explicit-any
        route={makeRoute({ notEmptyAccounts: true }) as any}
      />,
      { overrideInitialState: withAccounts([{ ...FUNDED_ETH, subAccounts: [FUNDED_TOKEN] }]) },
    );

    expect(screen.queryByTestId(`account-${FUNDED_ETH.id}`)).not.toBeNull();
    expect(screen.queryByTestId(`account-${FUNDED_TOKEN.id}`)).not.toBeNull();
  });
});

describe("SelectAccount — currencyIds multi-network filter", () => {
  it("keeps only accounts matching one of the currencyIds, across networks", () => {
    render(
      <SelectAccount
        // oxlint-disable-next-line typescript/no-explicit-any
        navigation={makeNavigation() as any}
        // oxlint-disable-next-line typescript/no-explicit-any
        route={makeRoute({ currencyIds: [usdtEth.id, usdtPoly.id] }) as any}
      />,
      {
        overrideInitialState: withAccounts([
          { ...ETH_PARENT, subAccounts: [USDT_ETH] },
          { ...POLY_PARENT, subAccounts: [USDT_POLY] },
        ]),
      },
    );

    expect(screen.getByTestId(`account-${USDT_ETH.id}`)).toBeVisible();
    expect(screen.getByTestId(`account-${USDT_POLY.id}`)).toBeVisible();
    expect(screen.queryByTestId(`account-${ETH_PARENT.id}`)).toBeNull();
    expect(screen.queryByTestId(`account-${POLY_PARENT.id}`)).toBeNull();
  });

  it("still filters empty token accounts via their parent bridge when notEmptyAccounts is set", () => {
    const EMPTY_USDT_POLY = {
      ...USDT_POLY,
      operations: [],
      operationsCount: 0,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    };

    render(
      <SelectAccount
        // oxlint-disable-next-line typescript/no-explicit-any
        navigation={makeNavigation() as any}
        // oxlint-disable-next-line typescript/no-explicit-any
        route={makeRoute({ currencyIds: [usdtEth.id, usdtPoly.id], notEmptyAccounts: true }) as any}
      />,
      {
        overrideInitialState: withAccounts([
          { ...ETH_PARENT, subAccounts: [USDT_ETH] },
          { ...POLY_PARENT, subAccounts: [EMPTY_USDT_POLY] },
        ]),
      },
    );

    expect(screen.getByTestId(`account-${USDT_ETH.id}`)).toBeVisible();
    expect(screen.queryByTestId(`account-${EMPTY_USDT_POLY.id}`)).toBeNull();
  });
});
