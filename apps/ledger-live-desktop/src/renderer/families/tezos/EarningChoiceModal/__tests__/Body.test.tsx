import React from "react";
import { act, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import Body from "../Body";

setSupportedCurrencies(["tezos"]);

const currency = getCryptoCurrencyById("tezos");
const account = { ...genAccount("tezos-body-test", { currency }) } as unknown as TezosAccount;

describe("EarningChoiceModal/Body", () => {
  it("renders title, description, and both action buttons", () => {
    render(<Body onClose={jest.fn()} params={{ account }} />);
    expect(screen.getByText(/Earn Tezos Rewards/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose the best way to grow your assets/i)).toBeInTheDocument();
    expect(screen.getByTestId("tezos-earn-choice-delegate-button")).toBeInTheDocument();
    expect(screen.getByTestId("tezos-earn-choice-stake-button")).toBeInTheDocument();
  });

  it("clicking Delegate closes the choice modal and opens MODAL_DELEGATE", async () => {
    const { user, store } = render(<Body onClose={jest.fn()} params={{ account }} />);

    await act(async () => {
      await user.click(screen.getByTestId("tezos-earn-choice-delegate-button"));
    });

    const modals = store.getState().modals;
    expect(modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBe(false);
    expect(modals.MODAL_DELEGATE?.isOpened).toBe(true);
  });

  it("clicking Stake closes the choice modal and opens MODAL_TEZOS_STAKE", async () => {
    const { user, store } = render(<Body onClose={jest.fn()} params={{ account }} />);

    await act(async () => {
      await user.click(screen.getByTestId("tezos-earn-choice-stake-button"));
    });

    const modals = store.getState().modals;
    expect(modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBe(false);
    expect(modals.MODAL_TEZOS_STAKE?.isOpened).toBe(true);
  });
});
