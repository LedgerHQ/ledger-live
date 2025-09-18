import { test } from "../fixtures/common";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { memoTagCoinTestData } from "../testdata/memoTagTestData";
import { initiateSendFlow } from "../utils/sendFlowUtils";

test.describe("MemoTag Feature", () => {
  memoTagCoinTestData.forEach(
    ({ coin, fromAccount, toAccount, testValue, testAmount, tagFieldName }) => {
      test.describe(`${coin} Send Flow with Memo Tag`, () => {
        test.use({
          userdata: "memo-tag-assets",
        });

        test(
          `${coin} - Send flow with Need Tag/Memo check and Don't add Tag selection`,
          {
            tag: ["@NanoSP", "@LNS", "@NanoX"],
            annotation: {
              type: "TMS",
              description: "B2CQA-2035",
            },
          },
          async ({ app }) => {
            // Initiate a send operation
            await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
            await initiateSendFlow(app, fromAccount, toAccount);

            //verify memo tag warning modal
            await app.memoTag.expectWarningMemoTagVisible();
            await app.memoTag.expectLearnMoreLinkVisible();
            await app.memoTag.expectCheckboxVisible();
            await app.memoTag.expectCheckboxUnchecked();
            await app.memoTag.tickCheckbox();
            await app.memoTag.expectCheckboxChecked();
            await app.memoTag.tickCheckbox();
            await app.memoTag.expectCheckboxUnchecked();

            // Choose to don't add tag
            await app.memoTag.expectDontAddTagButtonVisible();
            await app.memoTag.clickDontAddTag();
            await app.memoTag.expectMemoTagInputNotVisible();
            await app.memoTag.expectAmountInputVisible();
            await app.memoTag.fillAmountInput(testAmount);
            await app.memoTag.expectContinueButtonVisible();
            await app.memoTag.clickContinueButton();
            await app.memoTag.expectSummaryNotContainMemoTag(tagFieldName);
            await app.modal.close();

            // Initiate a send operation again
            await initiateSendFlow(app, fromAccount, toAccount);

            // Choose to add tag
            await app.memoTag.expectWarningMemoTagVisible();
            await app.memoTag.expectAddTagButtonVisible();
            await app.memoTag.clickAddTag();
            await app.memoTag.expectTagInputVisible();
            await app.memoTag.fillTagInput(testValue);
            await app.memoTag.expectContinueButtonVisible();
            await app.memoTag.expectContinueButtonEnabled();
            await app.memoTag.clickContinueButton();
            await app.memoTag.expectAmountInputVisible();
            await app.memoTag.fillAmountInput(testAmount);
            await app.memoTag.expectContinueButtonVisible();
            await app.memoTag.clickContinueButton();
            await app.memoTag.expectMemoTagFilledVisible();
            await app.memoTag.expectMemoTagContainsRightValue(tagFieldName);
            await app.memoTag.expectMemoTagContainsRightValue(testValue);

            await app.modal.close();
          },
        );
      });
    },
  );
});
