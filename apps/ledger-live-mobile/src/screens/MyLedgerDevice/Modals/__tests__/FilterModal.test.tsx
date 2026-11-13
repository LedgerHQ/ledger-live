import React from "react";
import { render, screen } from "@tests/test-renderer";
import FilterModal from "../FilterModal";

const baseProps = {
  filter: "all",
  setFilter: jest.fn(),
  sort: "marketcap",
  setSort: jest.fn(),
  order: "desc",
  setOrder: jest.fn(),
  isOpened: true,
  onClose: jest.fn(),
};

describe("FilterModal developer section", () => {
  it("is hidden when no developer setter is given", () => {
    render(<FilterModal {...baseProps} />);
    expect(screen.queryByText("Developer")).toBeNull();
  });

  it("applies the selected developer when the sheet closes", async () => {
    const setDeveloper = jest.fn();
    const { user } = render(
      <FilterModal {...baseProps} developer="all" setDeveloper={setDeveloper} />,
    );

    expect(await screen.findByText("Developer")).toBeVisible();
    await user.press(screen.getByText("Community app"));
    await user.press(screen.getByTestId("modal-close-button"));

    expect(setDeveloper).toHaveBeenCalledWith("community");
  });
});
