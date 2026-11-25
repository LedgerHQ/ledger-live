import React from "react";
import {
  trustchainStoreSelector,
  type TrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { render, screen } from "tests/testSetup";
import { db } from "~/renderer/bridge";
import IsUnlocked from "./IsUnlocked";

const storedTrustchain: TrustchainStore = {
  trustchain: {
    rootId: "root-id",
    walletSyncEncryptionKey: "wallet-sync-encryption-key",
    applicationPath: "m/0'/16'/0'",
  },
  memberCredentials: initMemberCredentials(),
};

const storedWallet = {
  walletSyncState: { data: null, version: 7 },
  accountsData: { accountNames: [] },
};

const malformedWallet = {
  walletSyncState: { data: null, version: 0 },
  accountsData: { accountNames: "not a list" },
};

function stored(values: Record<string, unknown>, { failsOnce }: { failsOnce?: string } = {}) {
  let failed = false;
  jest.mocked(db.getKey).mockImplementation(async (_ns, key) => {
    if (key === failsOnce && !failed) {
      failed = true;
      throw new Error("IPC failed");
    }
    return values[key];
  });
}

async function submitPassword(user: ReturnType<typeof render>["user"]) {
  await user.type(screen.getByTestId("lockscreen-password-input"), "password");
  await user.click(screen.getByTestId("lockscreen-login-button"));
}

function renderLocked() {
  return render(
    <IsUnlocked>
      <div>unlocked</div>
    </IsUnlocked>,
    { initialState: { application: { isLocked: true } } },
  );
}

describe("IsUnlocked", () => {
  beforeEach(() => {
    jest.mocked(db.hasBeenDecrypted).mockResolvedValueOnce(false).mockResolvedValue(true);
    jest.mocked(db.isEncryptionKeyCorrect).mockResolvedValue(true);
  });
  afterEach(() => {
    jest.mocked(db.getKey).mockReset().mockResolvedValue(undefined);
    jest.mocked(db.hasBeenDecrypted).mockReset().mockResolvedValue(true);
  });

  it("should stay locked, then unlock with the trustchain, when its first read fails", async () => {
    stored(
      { accounts: [], wallet: storedWallet, trustchain: storedTrustchain },
      { failsOnce: "trustchain" },
    );
    const { user, store } = renderLocked();

    await submitPassword(user);
    expect(await screen.findByText("The password entered is incorrect")).toBeVisible();
    expect(screen.queryByText("unlocked")).toBeNull();

    await submitPassword(user);
    expect(await screen.findByText("unlocked")).toBeVisible();
    expect(trustchainStoreSelector(store.getState()).trustchain).toEqual(
      storedTrustchain.trustchain,
    );
  });

  it("should stay locked, then unlock with the wallet, when its first import fails", async () => {
    const values: Record<string, unknown> = { accounts: [], wallet: malformedWallet };
    stored(values);
    const { user, store } = renderLocked();

    await submitPassword(user);
    expect(await screen.findByText("The password entered is incorrect")).toBeVisible();
    expect(screen.queryByText("unlocked")).toBeNull();

    values.wallet = storedWallet;
    await submitPassword(user);
    expect(await screen.findByText("unlocked")).toBeVisible();
    expect(store.getState().wallet.walletSync.walletSyncState).toEqual(
      storedWallet.walletSyncState,
    );
  });
});
