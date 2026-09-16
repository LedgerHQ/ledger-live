import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import {
  ALEO_BONDED_ACCOUNT,
  ALEO_BONDED_CLAIMABLE_ACCOUNT,
  ALEO_CLAIMABLE_ACCOUNT,
  ALEO_MAIN_ACCOUNT,
  ALEO_UNBONDING_ACCOUNT,
  withPendingOperation,
} from "../__mocks__/account.mock";
import { AleoCustomModal } from "../constants";
import ManageModal from "./ManageModal";

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

// Tippy renders its content lazily on hover, which jsdom makes unreliable. The rows only ever
// need the right message wired to the right reason, so expose that on the wrapper instead.
jest.mock("~/renderer/components/Tooltip", () => ({
  __esModule: true,
  default: ({
    content,
    enabled,
    children,
  }: {
    content: React.ReactNode;
    enabled?: boolean;
    children?: React.ReactNode;
  }) => <div data-tooltip={enabled ? String(content) : undefined}>{children}</div>,
}));

/** The message the row would show, or "" when it offers none. */
const tooltipFor = (testId: string) =>
  screen.getByTestId(testId).closest("[data-tooltip]")?.getAttribute("data-tooltip") ?? "";

function setup(acc: AleoAccount = ALEO_MAIN_ACCOUNT) {
  const modalsDiv = document.createElement("div");
  modalsDiv.id = "modals";
  document.body.appendChild(modalsDiv);

  return render(<ManageModal account={acc} />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        [AleoCustomModal.MANAGE]: {
          isOpened: true,
          data: { account: acc, parentAccount: null },
        },
      },
    },
  });
}

afterEach(() => {
  document.getElementById("modals")?.remove();
});

describe("Aleo ManageModal", () => {
  it("hands over to the bond flow when the bond row is clicked", async () => {
    const { store } = setup(ALEO_MAIN_ACCOUNT);

    await userEvent.click(await screen.findByTestId("aleo-bond-button"));

    expect(store.getState().modals[AleoCustomModal.BOND_PUBLIC]).toEqual({
      isOpened: true,
      data: { account: ALEO_MAIN_ACCOUNT },
    });
    expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
  });

  describe("unbond row", () => {
    it("hands over to the unbond flow when there is a bonded position", async () => {
      const { store } = setup(ALEO_BONDED_ACCOUNT);

      await userEvent.click(await screen.findByTestId("aleo-unbond-button"));

      expect(store.getState().modals[AleoCustomModal.UNBOND]).toEqual({
        isOpened: true,
        data: { account: ALEO_BONDED_ACCOUNT },
      });
      expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
    });

    it("stays disabled with nothing bonded", async () => {
      setup(ALEO_MAIN_ACCOUNT);

      expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
    });

    // `unbond_public` rewrites the single on-chain `unbonding` slot, and the synced staking
    // figures carry no optimistic adjustment — so a second unbond has to be closed off on the
    // pending pool rather than on the balances, which still show the pre-broadcast position.
    it("stays disabled while an unbond is pending, bonded balance notwithstanding", async () => {
      setup(withPendingOperation(ALEO_BONDED_ACCOUNT, "UNBOND"));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
    });

    // A pending claim occupies the same slot, so it locks unbonding too.
    it("stays disabled while a claim is pending", async () => {
      setup(withPendingOperation(ALEO_BONDED_CLAIMABLE_ACCOUNT, "WITHDRAW_UNBONDED"));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
    });

    it("is unaffected by an unrelated pending operation", async () => {
      setup(withPendingOperation(ALEO_BONDED_ACCOUNT, "OUT"));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeEnabled();
    });
  });

  describe("claim row", () => {
    it("hands over to the claim flow once the unbonding period has elapsed", async () => {
      const { store } = setup(ALEO_CLAIMABLE_ACCOUNT);

      await userEvent.click(await screen.findByTestId("aleo-claim-button"));

      expect(store.getState().modals[AleoCustomModal.CLAIM_UNBOND]).toEqual({
        isOpened: true,
        data: { account: ALEO_CLAIMABLE_ACCOUNT },
      });
      expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
    });

    it("stays disabled while the unbonding position is still counting down", async () => {
      setup(ALEO_UNBONDING_ACCOUNT);

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("stays disabled with nothing unbonding", async () => {
      setup(ALEO_BONDED_ACCOUNT);

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("stays disabled while a claim is pending", async () => {
      setup(withPendingOperation(ALEO_CLAIMABLE_ACCOUNT, "WITHDRAW_UNBONDED"));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("stays disabled while an unbond is pending", async () => {
      setup(withPendingOperation(ALEO_CLAIMABLE_ACCOUNT, "UNBOND"));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("is unaffected by an unrelated pending operation", async () => {
      setup(withPendingOperation(ALEO_CLAIMABLE_ACCOUNT, "OUT"));

      expect(await screen.findByTestId("aleo-claim-button")).toBeEnabled();
    });

    // Every disabled reason has to name itself: a greyed row with no explanation is the state
    // this row was left in while the flow did not exist.
    describe("explains why it is disabled", () => {
      it("names the countdown while the position has not matured", async () => {
        setup(ALEO_UNBONDING_ACCOUNT);
        await screen.findByTestId("aleo-claim-button");

        expect(tooltipFor("aleo-claim-button")).toMatch(/still in its unbonding period/);
      });

      it("names the missing position when there is nothing unbonding", async () => {
        setup(ALEO_BONDED_ACCOUNT);
        await screen.findByTestId("aleo-claim-button");

        expect(tooltipFor("aleo-claim-button")).toMatch(/no unbonded ALEO to claim/);
      });

      it("names the pending claim instead once one is in flight", async () => {
        setup(withPendingOperation(ALEO_CLAIMABLE_ACCOUNT, "WITHDRAW_UNBONDED"));
        await screen.findByTestId("aleo-claim-button");

        expect(tooltipFor("aleo-claim-button")).toMatch(/A claim is waiting to be confirmed/);
      });

      it("names the pending unbond when that is what holds the slot", async () => {
        setup(withPendingOperation(ALEO_CLAIMABLE_ACCOUNT, "UNBOND"));
        await screen.findByTestId("aleo-claim-button");

        expect(tooltipFor("aleo-claim-button")).toMatch(/An unstake is waiting to be confirmed/);
      });

      it("says nothing at all once the row is usable", async () => {
        setup(ALEO_CLAIMABLE_ACCOUNT);
        await screen.findByTestId("aleo-claim-button");

        expect(tooltipFor("aleo-claim-button")).toBe("");
      });
    });
  });
});
