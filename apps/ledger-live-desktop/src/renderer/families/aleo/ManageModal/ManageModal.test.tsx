import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import {
  ALEO_BONDED_ACCOUNT,
  ALEO_CLAIMABLE_ACCOUNT,
  ALEO_MAIN_ACCOUNT,
  ALEO_UNBONDING_ACCOUNT,
  withPendingOperations,
} from "../__mocks__/account.mock";
import { AleoCustomModal } from "../constants";
import ManageModal from "./ManageModal";

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

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
      setup(withPendingOperations(ALEO_BONDED_ACCOUNT, "UNBOND"));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
    });

    it("is unaffected by an unrelated pending operation", async () => {
      setup(withPendingOperations(ALEO_BONDED_ACCOUNT, "OUT"));

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

    // The chain only releases funds once it reaches `unbondingHeight`, so an unbonding
    // position that is still counting down must not offer a claim.
    it("stays disabled while the unbonding position is still counting down", async () => {
      setup(ALEO_UNBONDING_ACCOUNT);

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("stays disabled with nothing unbonding", async () => {
      setup(ALEO_BONDED_ACCOUNT);

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    // Same reasoning as the unbond row: the synced staking figures still describe the
    // pre-broadcast position, so a second claim is closed off on the pending pool.
    it("stays disabled while a claim is pending", async () => {
      setup(withPendingOperations(ALEO_CLAIMABLE_ACCOUNT, "WITHDRAW_UNBONDED"));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    // Aleo tracks one unbonding position per staker, and an unbond rewrites the same slot a
    // claim would read, so the two block each other.
    it("stays disabled while an unbond is pending", async () => {
      setup(withPendingOperations(ALEO_CLAIMABLE_ACCOUNT, "UNBOND"));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("is unaffected by an unrelated pending operation", async () => {
      setup(withPendingOperations(ALEO_CLAIMABLE_ACCOUNT, "OUT"));

      expect(await screen.findByTestId("aleo-claim-button")).toBeEnabled();
    });
  });

  // The unbond row is blocked by a pending claim for the same single-slot reason.
  it("disables the unbond row while a claim is pending", async () => {
    setup(withPendingOperations(ALEO_BONDED_ACCOUNT, "WITHDRAW_UNBONDED"));

    expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
  });
});
