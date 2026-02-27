import { test } from "../fixtures/common";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { memoTagCoinTestData } from "../testdata/memoTagTestData";
import { initiateSendFlow, initiateSendFlowToRecipientStep } from "../utils/sendFlowUtils";
import { Application } from "../page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import type { MemoTagSendFlowType } from "../testdata/memoTagTestData";

async function fillAmountAndContinueToSummary(app: Application, testAmount: string): Promise<void> {
  await app.memoTag.expectAmountInputVisible();
  await app.memoTag.fillAmountInput(testAmount);
  await app.memoTag.expectContinueButtonVisible();
  await app.memoTag.clickContinueButton();
}

async function runDontAddTagFlow(
  app: Application,
  fromAccount: Account,
  recipientAddress: string,
  testAmount: string,
  tagFieldName: string,
  sendFlowType: MemoTagSendFlowType,
): Promise<void> {
  if (sendFlowType === "stellar") {
    await initiateSendFlowToRecipientStep(app, fromAccount, recipientAddress);
    await app.memoTag.expectStellarMemoVisible();
    await app.memoTag.selectStellarMemoType("NO_MEMO");
    await app.memoTag.selectMatchedAddressAndProceed();
    await app.memoTag.expectDontAddTagButtonVisible();
    await app.memoTag.clickDontAddTag();
  } else {
    await initiateSendFlow(app, fromAccount, recipientAddress);
    await app.memoTag.expectWarningMemoTagVisible();
    await app.memoTag.expectLearnMoreLinkVisible();
    await app.memoTag.expectCheckboxVisible();
    await app.memoTag.expectCheckboxUnchecked();
    await app.memoTag.tickCheckbox();
    await app.memoTag.expectCheckboxChecked();
    await app.memoTag.tickCheckbox();
    await app.memoTag.expectCheckboxUnchecked();
    await app.memoTag.expectDontAddTagButtonVisible();
    await app.memoTag.clickDontAddTag();
    await app.memoTag.expectMemoTagInputNotVisible();
  }
  await fillAmountAndContinueToSummary(app, testAmount);
  await app.memoTag.expectSummaryNotContainMemoTag(tagFieldName);
  await app.modal.close();
}

async function runAddTagFlow(
  app: Application,
  fromAccount: Account,
  recipientAddress: string,
  testAmount: string,
  testValue: string,
  tagFieldName: string,
  sendFlowType: MemoTagSendFlowType,
): Promise<void> {
  if (sendFlowType === "stellar") {
    await initiateSendFlowToRecipientStep(app, fromAccount, recipientAddress);
    await app.memoTag.expectStellarMemoVisible();
    await app.memoTag.selectStellarMemoType("MEMO_TEXT");
    await app.memoTag.fillStellarMemoValue(testValue);
    await app.memoTag.selectMatchedAddressAndProceed();
  } else {
    await initiateSendFlow(app, fromAccount, recipientAddress);
    await app.memoTag.expectWarningMemoTagVisible();
    await app.memoTag.expectAddTagButtonVisible();
    await app.memoTag.clickAddTag();
    await app.memoTag.fillTagInput(testValue);
    await app.memoTag.expectContinueButtonVisible();
    await app.memoTag.expectContinueButtonEnabled();
    await app.memoTag.clickContinueButton();
  }
  await fillAmountAndContinueToSummary(app, testAmount);
  await app.memoTag.expectMemoTagFilledVisible();
  await app.memoTag.expectSummaryContainsText(tagFieldName);
  await app.memoTag.expectSummaryContainsText(testValue);
  await app.modal.close();
}

test.describe("MemoTag Feature", () => {
  for (const coinData of memoTagCoinTestData) {
    const {
      coin,
      fromAccount,
      recipientAddress,
      userdata,
      testValue,
      testAmount,
      tagFieldName = "Memo",
      sendFlowType = "modal",
    } = coinData;

    test.describe(`${coin} Send Flow with Memo Tag`, () => {
      test.use({
        userdata,
        userdataCurrencyFilter: fromAccount.currency.id,
        speculosApp: fromAccount.currency.speculosApp,
      });

      test(
        `${coin} - Send flow: first Don't add tag, then repeat with Add tag`,
        {
          tag: ["@NanoSP", "@LNS", "@NanoX"],
          annotation: {
            type: "TMS",
            description: "B2CQA-2035",
          },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

          await runDontAddTagFlow(
            app,
            fromAccount,
            recipientAddress,
            testAmount,
            tagFieldName,
            sendFlowType,
          );
          await runAddTagFlow(
            app,
            fromAccount,
            recipientAddress,
            testAmount,
            testValue,
            tagFieldName,
            sendFlowType,
          );
        },
      );
    });
  }
});
