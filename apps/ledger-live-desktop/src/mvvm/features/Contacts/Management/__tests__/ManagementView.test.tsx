import React from "react";
import { render, screen } from "tests/testSetup";
import type { Contact } from "~/renderer/contacts/types";
import { ManagementView } from "../ManagementView";
import { groupContacts, ME_CONTACT_NAME } from "../utils/groupContacts";

const stub = (name: string, entryCount = 0, chainId = 1): Contact => ({
  name,
  groupHandleHex: "",
  hmacNameHex: "",
  entries: Array.from({ length: entryCount }, (_, i) => ({
    scope: `scope-${i}`,
    addressHex: "0x" + i.toString(16).padStart(40, "0"),
    hmacRestHex: "",
    derivationPath: "44'/60'/0'/0/0",
    chainId,
  })),
});

const baseProps = (overrides: Partial<React.ComponentProps<typeof ManagementView>> = {}) => {
  const me = stub(ME_CONTACT_NAME, 1);
  const alice = stub("Alice", 2);
  const bob = stub("Bob", 0);
  const groups = groupContacts({ [me.name]: me, [alice.name]: alice, [bob.name]: bob }, "");
  return {
    groups,
    searchQuery: "",
    selectedContactName: ME_CONTACT_NAME,
    selectedContact: me,
    onSearchQueryChange: jest.fn(),
    onSelectContact: jest.fn(),
    ...overrides,
  };
};

describe("ManagementView", () => {
  it("renders header + list + details", () => {
    render(<ManagementView {...baseProps()} />);

    expect(screen.getByTestId("contacts-management-page")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-list")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-details")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-add-contact")).toBeInTheDocument();
  });

  it("renders one row per contact, including the pinned 'me'", () => {
    render(<ManagementView {...baseProps()} />);

    expect(screen.getAllByTestId("contacts-management-list-item")).toHaveLength(3);
    expect(screen.getAllByText("me")[0]).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("marks only the selected row with data-selected='true'", () => {
    render(<ManagementView {...baseProps()} />);

    const rows = screen.getAllByTestId("contacts-management-list-item");
    const selectedRows = rows.filter(r => r.getAttribute("data-selected") === "true");
    expect(selectedRows).toHaveLength(1);
  });

  it("calls onSelectContact when a row is clicked", async () => {
    const onSelectContact = jest.fn();
    const { user } = render(
      <ManagementView {...baseProps({ onSelectContact })} />,
    );

    await user.click(screen.getByText("Alice"));

    expect(onSelectContact).toHaveBeenCalledWith("Alice");
  });

  it("does NOT call onSelectContact when the already-selected row is clicked", async () => {
    // Per the Figma spec: the active (purple) row is a stable surface, not
    // a click target — Lumen's interactive flag flips off when onClick is
    // undefined, suppressing hover/press/cursor.
    const onSelectContact = jest.fn();
    const { user } = render(
      <ManagementView {...baseProps({ onSelectContact })} />,
    );

    // baseProps() selects "me" by default.
    await user.click(screen.getAllByText("me")[0]);

    expect(onSelectContact).not.toHaveBeenCalled();
  });

  it("renders one AddressRow per entry on the selected contact", () => {
    const alice = stub("Alice", 3);
    const groups = groupContacts({ alice }, "");
    render(
      <ManagementView
        {...baseProps({
          groups,
          selectedContact: alice,
          selectedContactName: "Alice",
        })}
      />,
    );

    expect(screen.getAllByTestId("contacts-management-address-row")).toHaveLength(3);
  });

  it("renders no address rows when the selected contact has zero entries", () => {
    const me = stub(ME_CONTACT_NAME, 0);
    render(
      <ManagementView
        {...baseProps({
          selectedContact: me,
        })}
      />,
    );

    expect(screen.queryAllByTestId("contacts-management-address-row")).toHaveLength(0);
  });

  it("calls onSearchQueryChange as the user types in the search input", async () => {
    const onSearchQueryChange = jest.fn();
    const { user } = render(
      <ManagementView {...baseProps({ onSearchQueryChange })} />,
    );

    const search = screen.getByTestId("contacts-management-search") as HTMLInputElement;
    await user.type(search, "A");

    expect(onSearchQueryChange).toHaveBeenCalled();
    // user.type fires per keystroke; we only care that at least one
    // call carried the typed character.
    const calls = onSearchQueryChange.mock.calls.map(c => c[0]);
    expect(calls.some((v: string) => v.includes("A"))).toBe(true);
  });
});
