import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactionHistoryView } from "./CardTransactionHistoryView.native";

jest.mock("react-native", () => {
  const React = jest.requireActual("react");
  const reactNative = jest.requireActual("react-native");

  return {
    ...reactNative,
    SectionList: ({
      sections,
      renderItem,
      renderSectionHeader,
      ...props
    }: {
      sections: Array<{ data: unknown[] }>;
      renderItem: (info: { item: unknown }) => React.ReactNode;
      renderSectionHeader: (info: { section: { data: unknown[] } }) => React.ReactNode;
    }) =>
      React.createElement(
        reactNative.View,
        props,
        sections.map((section, sectionIndex) =>
          React.createElement(
            React.Fragment,
            { key: `section-${sectionIndex}` },
            renderSectionHeader({ section }),
            ...section.data.map((item, itemIndex) =>
              React.createElement(
                React.Fragment,
                { key: `item-${itemIndex}` },
                renderItem({ item }),
              ),
            ),
          ),
        ),
      ),
  };
});

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);
const item = { transaction, categoryLabel: "Subscriptions" };
const wrapper = cardApiWrapper({ signedIn: true });

describe("CardTransactionHistoryView (native)", () => {
  it("renders the loading state", () => {
    render(
      <CardTransactionHistoryView displayState={{ kind: "loading" }} onRowClick={jest.fn()} />,
      {
        wrapper,
      },
    );

    expect(screen.getByTestId("card-history-loading-state")).toBeVisible();
  });

  it("renders grouped transactions with the host day formatter", () => {
    const formatDay = jest.fn(() => "Formatted day");

    render(
      <CardTransactionHistoryView
        displayState={{
          kind: "ready",
          groups: [{ day: new Date("2024-10-14T10:44:36.276Z"), items: [item] }],
        }}
        formatDay={formatDay}
        onRowClick={jest.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByText("Formatted day")).toBeVisible();
    expect(screen.getByTestId(`card-history-row-${transaction.id}`)).toBeVisible();
    expect(formatDay).toHaveBeenCalled();
  });

  it("opens the selected transaction from a row", async () => {
    const onRowClick = jest.fn();
    const user = userEvent.setup();

    render(
      <CardTransactionHistoryView
        displayState={{
          kind: "ready",
          groups: [{ day: new Date("2024-10-14T10:44:36.276Z"), items: [item] }],
        }}
        onRowClick={onRowClick}
      />,
      { wrapper },
    );

    await user.press(screen.getByTestId(`card-history-row-${transaction.id}`));

    expect(onRowClick).toHaveBeenCalledWith(item);
  });

  it("runs the Pay action from the empty state", async () => {
    const onGoToPay = jest.fn();
    const user = userEvent.setup();

    render(
      <CardTransactionHistoryView
        displayState={{ kind: "empty" }}
        onRowClick={jest.fn()}
        onGoToPay={onGoToPay}
      />,
      { wrapper },
    );

    await user.press(screen.getByTestId("card-history-empty-state-cta"));

    expect(onGoToPay).toHaveBeenCalledTimes(1);
  });
});
