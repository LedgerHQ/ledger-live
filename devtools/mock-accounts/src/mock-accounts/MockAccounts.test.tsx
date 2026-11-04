import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { computeAccountUUID, serializeAccountDescriptor } from "@domain/entity-account-descriptor";
import { mockDescriptors } from "../generate";
import { mockSource } from "../mockSource";
import type { MockAccountsToolAccount } from "../types";
import MockAccounts from "./MockAccounts";

function renderTool(accounts: MockAccountsToolAccount[] = []) {
  const props = { accounts, onAdd: jest.fn(), onRemove: jest.fn(), addSource: jest.fn() };
  render(<MockAccounts {...props} />);
  return props;
}

const [descriptor] = mockDescriptors("ethereum", 1, []);
const account = { accountUUID: computeAccountUUID(descriptor), descriptor };

describe("MockAccounts", () => {
  it("adds the mock source once loaded", () => {
    const { addSource } = renderTool();
    expect(addSource).toHaveBeenCalledWith(mockSource);
    expect(screen.getByText("No mock account.")).toBeVisible();
  });

  it("generates the requested count on the chosen network", async () => {
    const { onAdd } = renderTool([account]);
    await userEvent.selectOptions(screen.getByLabelText("Network"), "bitcoin");
    await userEvent.clear(screen.getByLabelText("Count"));
    await userEvent.type(screen.getByLabelText("Count"), "3");
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(onAdd).toHaveBeenCalledWith(mockDescriptors("bitcoin", 3, [descriptor]));
  });

  it("lists the mock accounts and removes them", async () => {
    const { onRemove } = renderTool([account]);
    expect(screen.getByText("1 mock account")).toBeVisible();
    expect(screen.getByText(serializeAccountDescriptor(descriptor))).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith([account.accountUUID]);
    await userEvent.click(screen.getByRole("button", { name: "Remove all" }));
    expect(onRemove).toHaveBeenLastCalledWith([account.accountUUID]);
  });
});
