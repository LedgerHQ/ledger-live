import React from "react";
import { act, render, screen } from "tests/testSetup";
import type { ValidatorInfo } from "@ledgerhq/live-common/families/mina/types";
import Delegations from "../index";
import {
  createDelegatingMinaAccount,
  createMockMinaAccount,
  mockValidators,
} from "../../__tests__/testUtils";

type DropDownItemShape = { key: string; label: string };

jest.mock("~/renderer/components/DropDownSelector", () => {
  const ReactActual = jest.requireActual("react") as typeof import("react");
  return {
    __esModule: true,
    default: ({
      items,
      renderItem,
      onChange,
    }: {
      items: DropDownItemShape[];
      renderItem: (args: { item: DropDownItemShape; isActive: boolean }) => React.ReactNode;
      onChange: (item: DropDownItemShape) => void;
    }) =>
      ReactActual.createElement(
        "div",
        { "data-testid": "dropdown-mock" },
        items.map(item =>
          ReactActual.createElement(
            "button",
            { type: "button", key: item.key, onClick: () => onChange(item) },
            renderItem({ item, isActive: false }),
          ),
        ),
      ),
    DropDownItem: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement("div", null, children),
  };
});

describe("Delegation (mina)", () => {
  it("renders nothing when the account is not delegating", () => {
    const { container } = render(<Delegations account={createMockMinaAccount()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a token account", () => {
    const account = createDelegatingMinaAccount();
    (account as unknown as { type: string }).type = "TokenAccount";

    const { container } = render(<Delegations account={account} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the delegation table with the validator name and balance", () => {
    render(<Delegations account={createDelegatingMinaAccount(mockValidators[0])} />);

    expect(screen.getByText("Delegation")).toBeInTheDocument();
    expect(screen.getByText("Validator")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText(mockValidators[0].identityName)).toBeInTheDocument();
    expect(screen.getByText("10 MINA")).toBeInTheDocument();
  });

  it("falls back to the delegate address when the validator has no identity name", () => {
    const anonymous = {
      ...mockValidators[1],
      identityName: undefined,
    } as unknown as ValidatorInfo;

    render(<Delegations account={createDelegatingMinaAccount(anonymous)} />);

    expect(screen.getByText(mockValidators[1].address)).toBeInTheDocument();
  });

  it("falls back to a dash when the delegate metadata is missing", () => {
    render(<Delegations account={createDelegatingMinaAccount(null)} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("opens MODAL_MINA_STAKE in delegate mode from the redelegate action", async () => {
    const account = createDelegatingMinaAccount();
    const { user, store } = render(<Delegations account={account} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Redelegate" }));
    });

    expect(store.getState().modals.MODAL_MINA_STAKE).toEqual({
      isOpened: true,
      data: { account },
    });
  });

  it("opens MODAL_MINA_STAKE in undelegate mode from the undelegate action", async () => {
    const account = createDelegatingMinaAccount();
    const { user, store } = render(<Delegations account={account} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Undelegate" }));
    });

    expect(store.getState().modals.MODAL_MINA_STAKE).toEqual({
      isOpened: true,
      data: { account, mode: "undelegate" },
    });
  });
});
