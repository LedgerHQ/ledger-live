import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { mockMeContact } from "@domain/entity-contact/schema.mock";
import { createEmptyContactsListViewModel } from "../../viewModel";
import { ContactsEmptyList } from "./ContactsEmptyList.web";

describe("ContactsEmptyList", () => {
  it("renders the empty list and delegates row actions", () => {
    const onOpenMe = jest.fn();
    const onAddContact = jest.fn();

    render(
      <ContactsEmptyList
        viewModel={createEmptyContactsListViewModel(mockMeContact())}
        labels={{
          title: "Contacts",
          searchPlaceholder: "Search contact",
          addContact: "Add contact",
          formatAddressCount: count => `${count} address`,
        }}
        meAvatarSrc="https://example.com/black/user.png"
        onOpenMe={onOpenMe}
        onAddContact={onAddContact}
      />,
    );

    expect(screen.getByTestId("contacts-page-layout")).toBeVisible();
    expect(screen.getByTestId("contacts-page-header")).toBeVisible();
    expect(screen.getByTestId("contacts-list-pane")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-pane").childElementCount).toBe(0);
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeVisible();
    expect((screen.getByPlaceholderText("Search contact") as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Me")).toBeVisible();
    expect(screen.getByText("0 address")).toBeVisible();
    const meAvatar = screen.getByTestId("contacts-empty-list-me-avatar");
    expect(meAvatar).toHaveAttribute("aria-hidden", "true");
    expect(meAvatar.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/black/user.png",
    );

    fireEvent.click(screen.getByTestId("contacts-empty-list-me-row"));
    fireEvent.click(screen.getByTestId("contacts-add-contact"));
    fireEvent.click(screen.getByTestId("contacts-add-contact-header"));

    expect(onOpenMe).toHaveBeenCalledWith("contact-me");
    expect(onAddContact).toHaveBeenCalledTimes(2);
  });
});
