import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { AccountAssetPicker } from "./AccountAssetPicker.web";
import type { AccountAssetPickerProps, AccountAssetPickerRow } from "./AccountAssetPicker.types";

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

describe("AccountAssetPicker (Web)", () => {
  it("lists each asset with its ticker and this account's balance", () => {
    renderPicker();

    expect(screen.getByRole("heading", { name: "Select an asset" })).toBeVisible();
    expect(screen.getByTestId(`${TEST_ID}-bitcoin`)).toHaveTextContent("Bitcoin");
    expect(screen.getByTestId(`${TEST_ID}-bitcoin`)).toHaveTextContent("BTC");
    expect(screen.getByTestId(`${TEST_ID}-bitcoin`)).toHaveTextContent("$40,000");
    expect(screen.getByTestId(`${TEST_ID}-bitcoin`)).toHaveTextContent("1 BTC");
    expect(screen.getByTestId(`${TEST_ID}-ethereum`)).toHaveTextContent("Ethereum");
    expect(screen.getByTestId(`${TEST_ID}-ethereum`)).toHaveTextContent("2 ETH");
  });

  it("reports the asset the user picks", async () => {
    const { props, user } = renderPicker();

    await user.click(screen.getByTestId(`${TEST_ID}-ethereum`));

    expect(props.onSelect).toHaveBeenCalledWith("ethereum");
  });

  it("shows the new assets when reopened after a close", () => {
    const { props, rerender } = renderPicker();

    rerender(<AccountAssetPicker {...props} open={false} rows={[]} />);
    rerender(<AccountAssetPicker {...props} open rows={[ethereum]} />);

    expect(screen.getByTestId(`${TEST_ID}-ethereum`)).toBeVisible();
    expect(screen.queryByTestId(`${TEST_ID}-bitcoin`)).toBeNull();
  });

  it("sizes the dialog to the listed assets", () => {
    renderPicker();

    expect(screen.getByTestId(TEST_ID)).toHaveAttribute("data-height", "fit");
  });

  it("renders nothing while closed", () => {
    renderPicker({ open: false });

    expect(screen.queryByTestId(TEST_ID)).toBeNull();
    expect(screen.queryByText("Bitcoin")).toBeNull();
  });
});
