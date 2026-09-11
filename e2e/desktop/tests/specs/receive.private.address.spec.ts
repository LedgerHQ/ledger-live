import fs from "fs";
import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

// Covers the returning user: an account whose private balance is already
// enabled opens Receive in a fresh session. `activate.private.balance.spec.ts`
// covers the other half -- enabling it and receiving in the same session.
const account = Account.ZEC_1;
const xrayTicket = "B2CQA-6606";

// The address the device derives for the shared QA seed at 44'/133'/0'/0/6.
// It has to be the real one: ZcashShieldedVerify compares the device's answer
// against this persisted value, so a made-up address would make the spec pass
// only while that verification is broken, and invert on the fix.
const ZEC_1_SHIELDED_ADDRESS =
  "u1rxupz6pfemaqnxkakpf846uf6euuaqhhgp7pf26he0c5k8xcm73e4khwj5fkmqe5rw58ppa4xevm3tny0sufvlywqngj2vus0g5rqt4j";

/** Writes an already-activated private balance into the seeded userdata. */
const seedPrivateInfo = async (userdataPath?: string) => {
  if (!userdataPath) return;
  const raw = JSON.parse(fs.readFileSync(userdataPath, "utf-8"));
  if (!Array.isArray(raw?.data?.accounts)) {
    throw new Error(
      `seedPrivateInfo: expected raw.data.accounts to be an array in ${userdataPath}`,
    );
  }
  const acc = raw.data.accounts.find((a: { data: { id: string } }) =>
    a.data.id.includes(account.currency.id),
  );
  if (!acc) {
    throw new Error(
      `seedPrivateInfo: no account matching "${account.currency.id}" in ${userdataPath}. Did liveDataCommand run first?`,
    );
  }
  // Only `shieldedAddress` drives the Receive block. The UFVK is left null and
  // the sync disabled so this fixture cannot feed a malformed viewing key to
  // any scanning path, rather than relying on none being reachable.
  acc.data.privateInfo = {
    orchardBalance: "0",
    saplingBalance: "0",
    ironwoodBalance: "0",
    syncState: "disabled",
    progress: 0,
    estimatedTimeRemaining: { hours: 0, minutes: 0 },
    ufvk: null,
    birthday: "2026-08-01",
    shieldedAddress: ZEC_1_SHIELDED_ADDRESS,
    lastSyncTimestamp: null,
    lastProcessedBlock: null,
    transactions: [],
  };
  fs.writeFileSync(userdataPath, JSON.stringify(raw));
};

test.describe("Receive private address", () => {
  test.use({
    teamOwner: Team.BST,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account, { postSeedHook: seedPrivateInfo })],
    featureFlags: { zcashShielded: { enabled: true } },
  });

  test(
    `[${account.currency.testLabel}] - Verify private address displayed`,
    {
      tag: buildTags({ currencyId: account.currency.id }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.clickReceive();
      await app.receive.continue();
      await app.receive.expectPrivateAddressBlockVisible();
      await app.receive.expectValidPrivateAddress(ZEC_1_SHIELDED_ADDRESS);
    },
  );
});
