import BigNumber from "bignumber.js";
import type { Account, AccountBridge, TransactionStatusCommon } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { getOperationIds, getSubAccount } from "./assert";
import { makeXrpAccount } from "./fixtures";
import { createFundedWallet, getBridges, setLocalXrpConfig } from "./helpers";
import {
  ASF_DEFAULT_RIPPLE,
  authorizeMpt,
  createMptIssuance,
  enableAccountFlag,
  issue,
  openTrustLine,
  setMptLocked,
  setTrustLineFrozen,
  TF_MPT_CAN_LOCK,
  TF_MPT_CAN_TRANSFER,
} from "./local-tx";
import { startXrpSandbox } from "./rippled";
import { buildXrpSigner, type XrplWallet } from "./signer";
import { installTokenStore, makeIouToken, makeMptToken, toIouAmount } from "./tokenFixtures";

global.console = require("console");
jest.setTimeout(600_000);

type Holder = {
  wallet: XrplWallet;
  accountBridge: AccountBridge<GenericTransaction>;
  token: TokenCurrency;
};

function sync({ accountBridge, wallet }: Holder): Promise<Account> {
  const account = makeXrpAccount(wallet.address);

  return new Promise((resolve, reject) => {
    let synced = account;
    accountBridge.sync(account, { paginationConfig: {} }).subscribe({
      next: update => {
        synced = update(synced);
      },
      error: reject,
      complete: () => resolve(synced),
    });
  });
}

async function getSendStatus(
  holder: Holder,
  recipient: string,
  amount: BigNumber,
): Promise<TransactionStatusCommon> {
  const { accountBridge, token } = holder;
  const account = await sync(holder);

  const transaction = accountBridge.updateTransaction(accountBridge.createTransaction(account), {
    subAccountId: encodeTokenAccountId(account.id, token),
    recipient,
    amount,
  });
  const prepared = await accountBridge.prepareTransaction(account, transaction);

  return accountBridge.getTransactionStatus(account, prepared);
}

/** A freeze or a lock: the whole balance stays, none of it is spendable, and no operation is added */
async function expectLocked(holder: Holder, isLocked: boolean, previous: Account) {
  const account = await sync(holder);
  const tokenAccount = getSubAccount(account, holder.token.id) as XrpTokenAccount;
  const previousBalance = getSubAccount(previous, holder.token.id).balance;

  expect(tokenAccount.xrpResources?.isLocked).toBe(isLocked);
  expect(tokenAccount.balance).toStrictEqual(previousBalance);
  expect(tokenAccount.spendableBalance).toStrictEqual(
    isLocked ? new BigNumber(0) : previousBalance,
  );
  expect(getOperationIds(account, holder.token.id)).toStrictEqual(
    getOperationIds(previous, holder.token.id),
  );
}

describe("XRP token negative cases", () => {
  let sandbox: Sandbox | undefined;
  let closeGuard: (() => void) | undefined;
  let issuer: XrplWallet;
  let secondHolder: XrplWallet;
  // Funded, with no line and no MPToken
  let stranger: XrplWallet;

  beforeAll(async () => {
    closeGuard = forbidRemoteRequests();
    sandbox = await startXrpSandbox();
    setLocalXrpConfig(["iou", "mpt"]);

    issuer = await createFundedWallet(sandbox, 100);
    secondHolder = await createFundedWallet(sandbox, 100);
    stranger = await createFundedWallet(sandbox, 100);
    // Lets holders pay each other through the issuer
    await enableAccountFlag(issuer, ASF_DEFAULT_RIPPLE);
  });

  afterAll(async () => {
    closeGuard?.();
    await sandbox?.down();
  });

  async function makeHolder(token: TokenCurrency, optIn: (wallet: XrplWallet) => Promise<void>) {
    if (!sandbox) throw new Error("the sandbox is not up");
    const wallet = await createFundedWallet(sandbox, 100);
    await optIn(wallet);

    const { accountBridge } = await getBridges(buildXrpSigner(wallet));

    return { wallet, accountBridge, token };
  }

  describe("IOU", () => {
    let holder: Holder;
    const amount = toIouAmount("1");

    beforeAll(async () => {
      const usd = makeIouToken("USD", issuer.address);
      installTokenStore([usd]);
      const line = { currency: "USD", issuer: issuer.address, limit: "1000" };
      await openTrustLine(secondHolder, line);
      holder = await makeHolder(usd, async wallet => {
        await openTrustLine(wallet, line);
        await issue(issuer, wallet.address, {
          currency: "USD",
          issuer: issuer.address,
          value: "10",
        });
      });
    });

    it("refuses a send to an account with no line", async () => {
      const status = await getSendStatus(holder, stranger.address, amount);

      expect(status.errors.recipient?.name).toBe("XrpRecipientTokenNotAdded");
    });

    it("refuses every send from a frozen line, to a holder and to the issuer", async () => {
      const line = { holder: holder.wallet.address, currency: "USD" };
      const beforeFreeze = await sync(holder);
      await setTrustLineFrozen(issuer, line, true);
      await expectLocked(holder, true, beforeFreeze);

      const toHolder = await getSendStatus(holder, secondHolder.address, amount);
      const toIssuer = await getSendStatus(holder, issuer.address, amount);
      expect(toHolder.errors.amount?.name).toBe("XrpTokenFrozen");
      expect(toIssuer.errors.amount?.name).toBe("XrpTokenFrozen");

      await setTrustLineFrozen(issuer, line, false);
      await expectLocked(holder, false, beforeFreeze);
      const afterUnfreeze = await getSendStatus(holder, secondHolder.address, amount);
      expect(afterUnfreeze.errors).toStrictEqual({});
    });
  });

  describe("MPT", () => {
    let holder: Holder;
    let issuanceId: string;
    const amount = new BigNumber(100);

    beforeAll(async () => {
      issuanceId = await createMptIssuance(issuer, {
        assetScale: 0,
        flags: TF_MPT_CAN_LOCK | TF_MPT_CAN_TRANSFER,
      });
      const mpt = makeMptToken({
        issuanceId,
        issuer: issuer.address,
        ticker: "MPT",
        assetScale: 0,
      });
      installTokenStore([mpt]);
      await authorizeMpt(secondHolder, issuanceId);
      holder = await makeHolder(mpt, async wallet => {
        await authorizeMpt(wallet, issuanceId);
        await issue(issuer, wallet.address, { mpt_issuance_id: issuanceId, value: "1000" });
      });
    });

    it("refuses a send to an account with no MPToken", async () => {
      const status = await getSendStatus(holder, stranger.address, amount);

      expect(status.errors.recipient?.name).toBe("XrpRecipientTokenNotAdded");
    });

    it("refuses every send from a locked holder, to a holder and to the issuer", async () => {
      const lock = { holder: holder.wallet.address, issuanceId };
      const beforeLock = await sync(holder);
      await setMptLocked(issuer, lock, true);
      await expectLocked(holder, true, beforeLock);

      const toHolder = await getSendStatus(holder, secondHolder.address, amount);
      const toIssuer = await getSendStatus(holder, issuer.address, amount);
      expect(toHolder.errors.amount?.name).toBe("XrpTokenFrozen");
      expect(toIssuer.errors.amount?.name).toBe("XrpTokenFrozen");

      await setMptLocked(issuer, lock, false);
      await expectLocked(holder, false, beforeLock);
      const afterUnlock = await getSendStatus(holder, secondHolder.address, amount);
      expect(afterUnlock.errors).toStrictEqual({});
    });
  });

  describe("enabledTokenStandards", () => {
    let holder: Holder;

    beforeAll(async () => {
      const usd = makeIouToken("USD", issuer.address);
      const issuanceId = await createMptIssuance(issuer, { assetScale: 0, flags: 0 });
      const mpt = makeMptToken({
        issuanceId,
        issuer: issuer.address,
        ticker: "MPT",
        assetScale: 0,
      });
      installTokenStore([usd, mpt]);
      holder = await makeHolder(usd, async wallet => {
        await openTrustLine(wallet, { currency: "USD", issuer: issuer.address, limit: "1000" });
        await issue(issuer, wallet.address, {
          currency: "USD",
          issuer: issuer.address,
          value: "10",
        });
        await authorizeMpt(wallet, issuanceId);
        await issue(issuer, wallet.address, { mpt_issuance_id: issuanceId, value: "1000" });
      });
    });

    it.each([
      [undefined, []],
      [["iou"], ["USD"]],
      [
        ["iou", "mpt"],
        ["MPT", "USD"],
      ],
    ])("with %j, syncs the token accounts %j", async (standards, tickers) => {
      setLocalXrpConfig(standards);
      const account = await sync(holder);

      expect(account.subAccounts?.map(sub => sub.token.ticker).sort()).toStrictEqual(tickers);
    });
  });
});
