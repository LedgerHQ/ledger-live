import fs from "fs";
import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import {
  zcashPrivateBalanceTestUse,
  zcashPrivateBalanceTestOptions,
  openZcashAccountUnderTest,
} from "tests/utils/zcashPrivateBalanceUtils";

// Enabling private balance (UFVK export) and then opening Receive in the SAME
// device session reproduces a device-reconnect bug: the Zcash DMK signer-kit
// hangs on any second device call within one session (tracked separately,
// see activate.private.balance.spec.ts). This spec sidesteps it by seeding
// privateInfo directly into the userdata file -- a fresh session, so Receive's
// own device-connect check is the only Zcash device call this test makes.
const seedZcashPrivateInfo = (account: Account) => {
  const cmd = async (userdataPath?: string) => {
    if (!userdataPath) return;
    const raw = JSON.parse(fs.readFileSync(userdataPath, "utf-8"));
    if (!Array.isArray(raw?.data?.accounts)) {
      throw new Error(
        `seedZcashPrivateInfo: expected raw.data.accounts to be an array in ${userdataPath}, got ${JSON.stringify(raw?.data)}`,
      );
    }
    const acc = raw.data.accounts.find((a: { data: { id: string } }) =>
      a.data.id.includes(account.currency.id),
    );
    if (!acc) {
      throw new Error(
        `seedZcashPrivateInfo: no account matching currency "${account.currency.id}" found in ${userdataPath}. Did liveDataCommand run first and add it?`,
      );
    }
    acc.data.privateInfo = {
      orchardBalance: "0",
      saplingBalance: "0",
      ironwoodBalance: "0",
      syncState: "ready",
      progress: 0,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1testnotreald3v1ceufvkplaceholderforuitest0000000000000000000",
      birthday: "2026-08-01",
      shieldedAddress:
        "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9",
      lastSyncTimestamp: null,
      lastProcessedBlock: null,
      transactions: [],
    };
    fs.writeFileSync(userdataPath, JSON.stringify(raw));
  };
  cmd.canUseGeneratedUserdata = () => false;
  return cmd;
};

const accounts = [{ account: Account.ZEC_1, xrayTicket: "B2CQA-6606" }];

for (const account of accounts) {
  test.describe("Receive private address", () => {
    test.use(zcashPrivateBalanceTestUse(account.account, [seedZcashPrivateInfo(account.account)]));

    test(
      `[${account.account.currency.testLabel}] - Verify private address displayed`,
      zcashPrivateBalanceTestOptions(account.account, account.xrayTicket),
      async ({ app }) => {
        await openZcashAccountUnderTest(app, account.account);
        await app.account.clickReceive();
        await app.receive.continue();
        // Proves the UI renders the private address block from the persisted
        // shieldedAddress. It does NOT prove the device's own background
        // shielded-address confirmation (ZcashShieldedVerify) succeeds -- that
        // call is a second Zcash device call in this session and still hangs,
        // it just doesn't block this visible block from rendering.
        await app.receive.expectPrivateAddressBlockVisible();
      },
    );
  });
}
