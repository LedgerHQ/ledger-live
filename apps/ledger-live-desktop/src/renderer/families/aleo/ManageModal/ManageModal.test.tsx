import BigNumber from "bignumber.js";
import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { AleoCustomModal } from "../constants";
import ManageModal from "./ManageModal";

jest.mock("@ledgerhq/crypto-icons", () => ({ CryptoIcon: jest.fn() }));

const pendingOperation = (type: OperationType): Operation =>
  ({
    id: `pending-${type}`,
    hash: "",
    type,
    value: new BigNumber(1),
    fee: new BigNumber(1),
    senders: [],
    recipients: [],
    accountId: ALEO_MAIN_ACCOUNT.id,
    date: new Date(),
    blockHash: null,
    blockHeight: null,
    extra: {},
  }) as unknown as Operation;

/**
 * `unbondingHeight` is compared against the account's synced `blockHeight`, which is pinned
 * here so "claimable" and "still unbonding" are expressed by that height alone.
 */
const account = ({
  bonded = 0,
  unbonding = 0,
  unbondingHeight = null,
  pendingOperations = [],
}: {
  bonded?: number;
  unbonding?: number;
  unbondingHeight?: number | null;
  pendingOperations?: Operation[];
} = {}): AleoAccount => ({
  ...ALEO_MAIN_ACCOUNT,
  blockHeight: 1_000,
  pendingOperations,
  aleoResources: {
    ...ALEO_MAIN_ACCOUNT.aleoResources!,
    bondedBalance: new BigNumber(bonded),
    unbondingBalance: new BigNumber(unbonding),
    unbondingHeight,
  },
});

const CLAIMABLE = { unbonding: 15_000_000_000, unbondingHeight: 900 };
const STILL_UNBONDING = { unbonding: 15_000_000_000, unbondingHeight: 1_100 };

function setup(acc: AleoAccount = account()) {
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
    const acc = account();
    const { store } = setup(acc);

    await userEvent.click(await screen.findByTestId("aleo-bond-button"));

    expect(store.getState().modals[AleoCustomModal.BOND_PUBLIC]).toEqual({
      isOpened: true,
      data: { account: acc },
    });
    expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
  });

  describe("unbond row", () => {
    it("hands over to the unbond flow when there is a bonded position", async () => {
      const acc = account({ bonded: 20_000_000_000 });
      const { store } = setup(acc);

      await userEvent.click(await screen.findByTestId("aleo-unbond-button"));

      expect(store.getState().modals[AleoCustomModal.UNBOND]).toEqual({
        isOpened: true,
        data: { account: acc },
      });
      expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
    });

    it("stays disabled with nothing bonded", async () => {
      setup(account({ bonded: 0 }));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
    });

    // `unbond_public` rewrites the single on-chain `unbonding` slot, and the synced staking
    // figures carry no optimistic adjustment — so a second unbond has to be closed off on the
    // pending pool rather than on the balances, which still show the pre-broadcast position.
    it("stays disabled while an unbond is pending, bonded balance notwithstanding", async () => {
      setup(account({ bonded: 20_000_000_000, pendingOperations: [pendingOperation("UNBOND")] }));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
    });

    it("is unaffected by an unrelated pending operation", async () => {
      setup(account({ bonded: 20_000_000_000, pendingOperations: [pendingOperation("OUT")] }));

      expect(await screen.findByTestId("aleo-unbond-button")).toBeEnabled();
    });
  });

  describe("claim row", () => {
    it("hands over to the claim flow once the unbonding period has elapsed", async () => {
      const acc = account(CLAIMABLE);
      const { store } = setup(acc);

      await userEvent.click(await screen.findByTestId("aleo-claim-button"));

      expect(store.getState().modals[AleoCustomModal.CLAIM_UNBOND]).toEqual({
        isOpened: true,
        data: { account: acc },
      });
      expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
    });

    // The chain only releases funds once it reaches `unbondingHeight`, so an unbonding
    // position that is still counting down must not offer a claim.
    it("stays disabled while the unbonding position is still counting down", async () => {
      setup(account(STILL_UNBONDING));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("stays disabled with nothing unbonding", async () => {
      setup(account({ bonded: 20_000_000_000 }));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    // Same reasoning as the unbond row: the synced staking figures still describe the
    // pre-broadcast position, so a second claim is closed off on the pending pool.
    it("stays disabled while a claim is pending", async () => {
      setup(account({ ...CLAIMABLE, pendingOperations: [pendingOperation("WITHDRAW_UNBONDED")] }));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    // Aleo tracks one unbonding position per staker, and an unbond rewrites the same slot a
    // claim would read, so the two block each other.
    it("stays disabled while an unbond is pending", async () => {
      setup(account({ ...CLAIMABLE, pendingOperations: [pendingOperation("UNBOND")] }));

      expect(await screen.findByTestId("aleo-claim-button")).toBeDisabled();
    });

    it("is unaffected by an unrelated pending operation", async () => {
      setup(account({ ...CLAIMABLE, pendingOperations: [pendingOperation("OUT")] }));

      expect(await screen.findByTestId("aleo-claim-button")).toBeEnabled();
    });
  });

  // The unbond row is blocked by a pending claim for the same single-slot reason.
  it("disables the unbond row while a claim is pending", async () => {
    setup(
      account({
        bonded: 20_000_000_000,
        pendingOperations: [pendingOperation("WITHDRAW_UNBONDED")],
      }),
    );

    expect(await screen.findByTestId("aleo-unbond-button")).toBeDisabled();
  });
});
