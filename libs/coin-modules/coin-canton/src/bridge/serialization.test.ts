import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { CantonAccount, CantonAccountRaw } from "../types";
import { createMockCantonAccount } from "../test/fixtures";
import { assignFromAccountRaw, assignToAccountRaw, isCantonAccount } from "./serialization";

// Hooks receive a freshly-built destination with no cantonResources; a destination
// guard would drop the block (and with it publicKey → no topology prompt). LIVE-34585
describe("canton account serialization", () => {
  const PUBLIC_KEY = "0adf6d966d86e42dc1ed76b466f14a2efd0fcf05b89106b9aec4341e6f6a74ee";
  const PARTY_ID = "ldg::122087b04005bdc77c9548701ebc4c2df8bc0c37960258ab700d127e5775fc8cde96";

  it("persists cantonResources onto a freshly-built AccountRaw", () => {
    const account = createMockCantonAccount(
      {},
      {
        isOnboarded: true,
        publicKey: PUBLIC_KEY,
        xpub: PARTY_ID,
      },
    ) as Account;

    // fresh raw, no cantonResources yet
    const accountRaw = { id: account.id } as AccountRaw;
    expect("cantonResources" in accountRaw).toBe(false);

    assignToAccountRaw(account, accountRaw);

    const raw = accountRaw as CantonAccountRaw;
    expect(raw.cantonResources).toEqual(
      expect.objectContaining({ publicKey: PUBLIC_KEY, isOnboarded: true, xpub: PARTY_ID }),
    );
  });

  it("restores cantonResources onto a freshly-built Account", () => {
    const accountRaw = { id: "acc" } as CantonAccountRaw;
    accountRaw.cantonResources = {
      isOnboarded: true,
      instrumentUtxoCounts: {},
      pendingTransferProposals: [],
      publicKey: PUBLIC_KEY,
      xpub: PARTY_ID,
    };

    // fresh account, no cantonResources yet
    const account = { id: "acc" } as Account;
    expect("cantonResources" in account).toBe(false);

    assignFromAccountRaw(accountRaw as AccountRaw, account);

    expect(isCantonAccount(account)).toBe(true);
    expect((account as CantonAccount).cantonResources.publicKey).toBe(PUBLIC_KEY);
    expect((account as CantonAccount).cantonResources.isOnboarded).toBe(true);
  });

  it("round-trips publicKey through save and restore", () => {
    const account = createMockCantonAccount(
      {},
      {
        isOnboarded: true,
        publicKey: PUBLIC_KEY,
        xpub: PARTY_ID,
      },
    ) as Account;

    const accountRaw = { id: account.id } as AccountRaw;
    assignToAccountRaw(account, accountRaw);

    const restored = { id: account.id } as Account;
    assignFromAccountRaw(accountRaw, restored);

    expect((restored as CantonAccount).cantonResources.publicKey).toBe(PUBLIC_KEY);
  });

  it("omits publicKey from the raw when it is empty", () => {
    const account = createMockCantonAccount({}, { isOnboarded: true }) as Account;
    const accountRaw = { id: account.id } as AccountRaw;

    assignToAccountRaw(account, accountRaw);

    const raw = accountRaw as CantonAccountRaw;
    expect(raw.cantonResources.isOnboarded).toBe(true);
    expect("publicKey" in raw.cantonResources).toBe(false);
  });
});
