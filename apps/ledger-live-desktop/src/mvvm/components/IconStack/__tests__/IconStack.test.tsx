import React from "react";
import { render, screen } from "tests/testSetup";
import { IconStack } from "../index";

type TestItem = { readonly id: string; readonly label: string };

describe("IconStack", () => {
  it("shows an overflow badge and tooltip when there are more items than max visible", async () => {
    const items: TestItem[] = [
      { id: "eth", label: "ETH" },
      { id: "usdc", label: "USDC" },
      { id: "btc", label: "BTC" },
      { id: "eth2", label: "ETH" },
      { id: "usdc2", label: "USDC" },
      { id: "extra", label: "SOL" },
    ];

    const { user } = render(
      <IconStack<TestItem>
        size={20}
        testID="items-stack"
        items={items}
        getItemKey={item => item.id}
        renderItem={item => <span>{item.label}</span>}
        getTooltipContent={allItems => allItems.map(item => item.label).join(", ")}
        overflowTestID="icon-stack-overflow"
      />,
    );

    expect(screen.getByTestId("icon-stack-overflow")).toHaveTextContent("+3");

    await user.hover(screen.getByTestId("items-stack"));

    expect(
      await screen.findByRole("tooltip", { name: "ETH, USDC, BTC, ETH, USDC, SOL" }),
    ).toBeVisible();
  });
});
