import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { AccountAssetPicker } from "./AccountAssetPicker";
import type { AccountAssetPickerProps, AccountAssetPickerRow } from "./AccountAssetPicker.types";

jest.mock("@ledgerhq/crypto-icons/native", () => () => null);
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  type ListProps = Readonly<{
    data: readonly unknown[];
    renderItem: (info: Readonly<{ item: unknown; index: number }>) => React.ReactNode;
    keyExtractor: (item: unknown, index: number) => string;
    testID?: string;
  }>;

  function BottomSheetFlatList({ data, renderItem, keyExtractor, testID }: ListProps) {
    return ReactActual.createElement(
      View,
      { testID },
      data.map((item, index) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: keyExtractor(item, index) },
          renderItem({ item, index }),
        ),
      ),
    );
  }

  return new Proxy(actual, {
    get(target, prop) {
      return prop === "BottomSheetFlatList" ? BottomSheetFlatList : target[prop as string];
    },
  });
});

const TEST_ID = "asset-picker";

const bitcoin: AccountAssetPickerRow = {
  id: "bitcoin",
  ledgerId: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  cryptoAmount: "1 BTC",
  countervalue: "$40,000",
};

const ethereum: AccountAssetPickerRow = {
  id: "ethereum",
  ledgerId: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  cryptoAmount: "2 ETH",
};

function renderPicker(overrides: Partial<AccountAssetPickerProps> = {}) {
  const props: AccountAssetPickerProps = {
    open: true,
    rows: [bitcoin, ethereum],
    onSelect: jest.fn(),
    onClose: jest.fn(),
    testID: TEST_ID,
    ...overrides,
  };
  const view = render(<AccountAssetPicker {...props} />, { wrapper: I18nWrapper });
  return { props, user: userEvent.setup(), rerender: view.rerender };
}

describe("AccountAssetPicker (Native)", () => {
  it("lists each asset with its ticker and this account's balance", () => {
    renderPicker();

    expect(screen.getByTestId(TEST_ID)).toBeExpanded();
    expect(screen.getByTestId(`${TEST_ID}-list`)).toBeVisible();
    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("$40,000")).toBeVisible();
    expect(screen.getByText("1 BTC")).toBeVisible();
    expect(screen.getByText("Ethereum")).toBeVisible();
    expect(screen.getByText("2 ETH")).toBeVisible();
  });

  it("reports the asset the user picks", async () => {
    const { props, user } = renderPicker();

    await user.press(screen.getByTestId(`${TEST_ID}-ethereum`));

    expect(props.onSelect).toHaveBeenCalledWith("ethereum");
  });

  it("keeps the rows until the sheet has finished hiding", async () => {
    const { props, user, rerender } = renderPicker();
    const view = screen.getByTestId(TEST_ID);

    rerender(<AccountAssetPicker {...props} open={false} rows={[]} />);

    expect(view).toBeCollapsed();
    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByTestId(`${TEST_ID}-list`)).toBeVisible();

    await user.press(screen.getByTestId(`${TEST_ID}-hidden`));

    expect(screen.queryByText("Bitcoin")).toBeNull();
    expect(screen.queryByTestId(`${TEST_ID}-list`)).toBeNull();
  });

  it("renders no rows while closed", () => {
    renderPicker({ open: false });

    expect(screen.getByTestId(TEST_ID)).toBeCollapsed();
    expect(screen.queryByTestId(`${TEST_ID}-list`)).toBeNull();
    expect(screen.queryByText("Bitcoin")).toBeNull();
  });
});
