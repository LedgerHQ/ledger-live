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

  it("renders the contacts row when the alpha flag is on", () => {
    render(<Contacts />, {
      initialState: { settings: { contactsAlpha: true } },
    });

    expect(screen.getByText("Contacts")).toBeVisible();
    expect(screen.getByText("Manage your contacts")).toBeVisible();
  });

  it("renders nothing when the alpha flag is off", () => {
    const { container } = render(<Contacts />, {
      initialState: { settings: { contactsAlpha: false } },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("calls handleClick when the row is clicked", async () => {
    const { user } = render(<Contacts />, {
      initialState: { settings: { contactsAlpha: true } },
    });

    await user.click(screen.getByText("Contacts"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
