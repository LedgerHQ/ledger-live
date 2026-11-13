import React from "react";
import { render, screen } from "tests/testSetup";
import DeveloperFilter from "../DeveloperFilter";

describe("DeveloperFilter", () => {
  it("shows the selected developer filter", () => {
    render(<DeveloperFilter developer="community" onDeveloperChange={jest.fn()} />);
    expect(screen.getByTestId("manager-developer-filter-button")).toHaveTextContent(
      "DeveloperCommunity app",
    );
  });

  it("selects another developer filter", async () => {
    const onDeveloperChange = jest.fn();
    const { user } = render(
      <DeveloperFilter developer="all" onDeveloperChange={onDeveloperChange} />,
    );

    await user.click(screen.getByTestId("manager-developer-filter-button"));
    await user.click(screen.getByTestId("manager-developer-filter-option-ledger"));

    expect(onDeveloperChange).toHaveBeenCalledWith("ledger");
  });
});
