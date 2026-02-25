import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import test from "../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { expect } from "@playwright/test";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

test.use({
  userdata: "sanctioned-addresses",
});

test("Blacklisted addresses", async ({ app }) => {
  await test.step("[Blacklist] Blocking transactions to sanctioned recipient addresses in send flow", async () => {
    const transaction = new Transaction(
      Account.ETH_1,
      Account.SANCTIONED_ETH,
      "0.00001",
      Fee.MEDIUM,
    );

    await app.layout.goToAccounts();
    await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

    await app.account.clickSend();
    await app.send.fillRecipient(Addresses.SANCTIONED_ETHEREUM);
    const errorMessage = await app.send.getErrorMessage();
    expect(errorMessage).toBe(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM} Learn more`,
    );

    await app.send.closeModal();
  });

  await test.step("[Blacklist] Blocking transactions from sanctioned user addresses in send flow", async () => {
    const transaction = new Transaction(
      Account.SANCTIONED_ETH,
      Account.ETH_1,
      "0.00001",
      Fee.MEDIUM,
    );

    await app.layout.goToAccounts();
    await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

    await app.account.clickSend();
    const senderErrorMessage = await app.send.getSenderErrorMessage();
    expect(senderErrorMessage?.startsWith("Keeping you safe")).toBe(true);

    const remainingMessage = senderErrorMessage?.replace("Keeping you safe", "");
    expect(remainingMessage).toEqual(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM} Learn more`,
    );

    expect(await app.send.getContinueButton()).toBeDisabled();

    await app.send.closeModal();
  });

  await test.step("[Blacklist] Blocking transactions to and from sanctioned user addresses in send flow", async () => {
    const transaction = new Transaction(
      Account.SANCTIONED_ETH,
      Account.SANCTIONED_ETH,
      "0.00001",
      Fee.MEDIUM,
    );

    await app.layout.goToAccounts();
    await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

    await app.account.clickSend();

    const senderErrorMessage = await app.send.getSenderErrorMessage();
    expect(senderErrorMessage?.startsWith("Keeping you safe")).toBe(true);

    const remainingMessage = senderErrorMessage?.replace("Keeping you safe", "");
    expect(remainingMessage).toEqual(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM} Learn more`,
    );

    expect(await app.send.getContinueButton()).toBeDisabled();

    await app.send.fillRecipient(Addresses.SANCTIONED_ETHEREUM);
    const errorMessage = await app.send.getErrorMessage();
    expect(errorMessage).toBe(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM} Learn more`,
    );

    await app.send.closeModal();
  });
});
