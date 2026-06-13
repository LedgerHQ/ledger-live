import React from "react";
import { render, screen } from "tests/testSetup";
import * as UseContactsViewModel from "./hooks/useContactsViewModel";
import { Contacts } from "./index";

jest.mock("./hooks/useContactsViewModel", () => ({
  useContactsViewModel: jest.fn(),
}));

const handleClick = jest.fn();

describe("Contacts (user-menu row)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(UseContactsViewModel, "useContactsViewModel").mockReturnValue({
      title: "Contacts",
      description: "Manage your contacts",
      handleClick,
    });
  });

  it("renders the contacts row", () => {
    render(<Contacts />);

    expect(screen.getByText("Contacts")).toBeVisible();
    expect(screen.getByText("Manage your contacts")).toBeVisible();
  });

  it("calls handleClick when the row is clicked", async () => {
    const { user } = render(<Contacts />);

    await user.click(screen.getByText("Contacts"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
