import test from "../../fixtures/common";
import { FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED } from "tests/utils/featureFlagUtils";
import { expect, Page } from "@playwright/test";
import { AccountPage } from "../../page/account.page";
import { AccountsPage } from "../../page/accounts.page";
import { Layout } from "../../component/layout.component";
import { DeviceAction } from "../../models/DeviceAction";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { BigNumber } from "bignumber.js";
import { Application } from "tests/page";
import { StellarMemoType } from "tests/page/modal/new.send.modal";

const FEE_PRESETS = ["slow", "medium", "fast"] as const;

// Test addresses per family (using abandon seed addresses for safety)
const TEST_ADDRESSES = {
  ethereum: "0x000000000000000000000000000000000000dEaD",
  arbitrum: "0x000000000000000000000000000000000000dEaD",
  bitcoin: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  tezos: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
  /** Algorand 1 freshAddress in userdata — self-transfer is impossible on Algorand. */
  algorand: "PSHLIWQKDEETIIBQEOTLGCT5IF7BTTOKCUULONOGVGF2HYDT2IHW3H4CCI",
  /** Valid Algorand recipient, distinct from Algorand 1 account (coin-algorand bridge test dataset). */
  algorandRecipient: "MVE6C3XB4JBKXKORC3NLAWFW4M7EY3MADU6L72DADFP4NZBJIAYXGSLN3Y",
  stellar: "GDYPMQMYW2JTLPWAUAHIDY3E4VHP5SGTFC5SMA45L7ZPOTHWQ2PHEW3E", // abandonSeed address
  xrp: "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3", // abandonSeed address
  newAddress: "0x2222222222222222222222222222222222222222",
  selfEthereum: "0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707",
  selfTezos: "tz1VJitLYB31fEC82efFkLRU4AQUH9QgH3q6",
  // t1 P2PKH, from wallet-btc/__tests__/utils.test.ts (coin-zcash/src/logic/address.test.ts:30)
  zcashTransparent: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
  // Orchard-only unified address, from the Ledger Zcash device app's own test suite
  // (coin-zcash/src/logic/address.test.ts:34-35, firmware/app-zcash test_pubkey_cmd.py
  // REF_ORCHARD_ADDRESS_ACC_0)
  zcashOrchard:
    "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9",
  // Sapling address, blocked with ZcashSaplingRecipientNotSupported (coin-zcash/src/logic/address.test.ts:67)
  zcashSapling: "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya",
};

const INVALID_ADDRESSES = {
  ethereum: "0xinvalid",
};

// Account names in userdata
const ACCOUNT_NAMES = {
  bitcoin: "Bitcoin 2 (legacy)",
  ethereum: "Ethereum 1",
  arbitrum: "Arbitrum 1",
  tezos: "Tezos 1",
  algorand: "Algorand 1",
  stellar: "Stellar 1",
  xrp: "XRP 1",
  zcash: "Zcash 1",
};

test.use({
  userdata:
    "1AccountBTC1AccountETH1AccountARB1AccountSOL1AccountXTZ1AccountXLM1AccountALGO1AccountXRP",
  featureFlags: {
    ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
    newSendFlow: {
      enabled: true,
      params: {
        // Include bitcoin + kaspa to cover fee presets across families when supported.
        families: [
          "tezos",
          "tron",
          "evm",
          "near",
          "solana",
          "algorand",
          "stellar",
          "xrp",
          "bitcoin",
          "kaspa",
        ],
      },
    },
  },
});

test.describe("New Send Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure BTC fee presets are deterministic in tests/videos: Slow/Medium/Fast all present.
    await page.route(
      "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
      async route => {
        await route.fulfill({
          headers: { teststatus: "mocked" },
          body: JSON.stringify({
            // api.ts maps 1->fast, 3->medium, 6->slow
            "1": 4000, // fast: 4 sat/vbyte (ceil(4000/1000) => 4)
            "3": 3000, // medium: 3 sat/vbyte
            "6": 2000, // slow: 2 sat/vbyte
            last_updated: Date.now(),
          }),
        });
      },
    );
  });

  // The dynamic-content "what's new" promo (data-testid="generic-awareness-modal", see
  // GenericAwarenessModalView.tsx) is driven by a live Braze content-card fetch, so whether
  // it renders -- and when -- depends on that fetch's network conditions, not on any fixture
  // or feature flag under our control here. Closing it if present keeps the flow from
  // blocking on it without asserting anything about whether it shows.
  async function dismissGenericAwarenessModalIfPresent(page: Page) {
    const modal = page.getByTestId("generic-awareness-modal");
    if (await modal.isVisible().catch(() => false)) {
      await modal.getByRole("button", { name: "Close" }).click();
      await expect(modal).not.toBeVisible();
    }
  }

  // The release tour ("what's new") auto-opens on Portfolio whenever the `releaseTour` flag is
  // on and the tour has not been seen (useReleaseTourDrawerViewModel.ts), and being a Radix
  // modal it swallows every click on the sidebar until closed. Its slides are what tell it
  // apart from the send-flow dialog: ReleaseTourDialog.tsx tags each one `<tourId>-tour-slide-N`.
  // Closing it marks the tour as seen, so it does not come back within the same run.
  async function dismissReleaseTourIfPresent(page: Page) {
    const tour = page
      .getByRole("dialog")
      .filter({ has: page.locator('[data-testid*="-tour-slide-"]') })
      .first();
    if (await tour.isVisible().catch(() => false)) {
      await tour.getByRole("button", { name: "Close" }).click();
      await expect(tour).not.toBeVisible();
    }
  }

  // Analytics opt-in (`analytics-consent-dialog`) is a Radix modal with no Close control and
  // outside-click / Escape disabled — it swallows sidebar clicks until a footer CTA is chosen.
  // It opens on Portfolio when `analyticsOptIn` is on and consent is missing or due for
  // reconfirm ("Continue improving Ledger?"). Opting out completes consent so it stays gone.
  async function dismissAnalyticsConsentDialogIfPresent(page: Page) {
    const dialog = page.getByTestId("analytics-consent-dialog");
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole("button", { name: /^(Refuse all|No, stop|Got it)$/ }).click();
      await expect(dialog).not.toBeVisible();
    }
  }

  // These modals can appear *after* this wait has already started -- the awareness modal because
  // its fetch is a live network call, the release tour and analytics consent because they open
  // once Portfolio mounts -- so a single pre-check can race them: the modal appears mid-wait
  // and then never gets dismissed, since nothing is re-checking. Polling in short slices, and
  // dismissing between them, means they get closed whichever side of the race they land.
  async function goToAccountsDismissingBlockingModals(page: Page) {
    const accountsButton = new Layout(page).drawerAccountsButton;

    for (let attempt = 0; attempt < 20; attempt++) {
      await dismissReleaseTourIfPresent(page);
      await dismissGenericAwarenessModalIfPresent(page);
      await dismissAnalyticsConsentDialogIfPresent(page);
      try {
        await accountsButton.waitFor({ state: "visible", timeout: 3000 });
        // Bounded to the same short slice as the wait above: a modal can still mount in the
        // gap between the wait resolving and the click landing, intercepting it -- this keeps
        // that case retrying quickly too, rather than hanging on the suite's default action
        // timeout for a single attempt.
        await accountsButton.click({ timeout: 3000 });
        return;
      } catch {
        // Not visible yet, or the click was intercepted, within this slice; loop back to
        // re-check the modals and retry.
      }
    }
    // Final attempt with the default timeout, so a genuine failure still surfaces its real error.
    await dismissReleaseTourIfPresent(page);
    await dismissGenericAwarenessModalIfPresent(page);
    await dismissAnalyticsConsentDialogIfPresent(page);
    await accountsButton.waitFor({ state: "visible" });
    await accountsButton.click();
  }

  // Helper function to navigate to account and open send flow
  async function openSendFlowForAccount(app: Application, page: Page, accountName: string) {
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);

    await goToAccountsDismissingBlockingModals(page);
    await expect(page.getByTestId(`account-component-${accountName}`)).toBeVisible({
      timeout: 20000,
    });

    await accountsPage.navigateToAccountByName(accountName);
    await accountPage.settingsButton.waitFor({ state: "visible", timeout: 20000 });

    await accountPage.clickSend();
    await app.newSendFlow.waitForDialog();
  }

  async function reachSignatureStep(
    app: Application,
    page: Page,
    accountName: string,
    address: string,
  ) {
    await openSendFlowForAccount(app, page, accountName);
    await app.newSendFlow.reachSignatureStep(address);
  }

  async function reachAmountStep(
    app: Application,
    page: Page,
    accountName: string,
    address: string,
    hasMemo: boolean = false,
  ) {
    await openSendFlowForAccount(app, page, accountName);
    await app.newSendFlow.reachAmountStep(address, hasMemo);
  }

  async function mockDeviceError(page: Page, errorName: string) {
    await page.evaluate((name: string) => {
      const w = window as any;
      w?.mock?.events?.mockDeviceEvent({ type: "error", error: { name } });
    }, errorName);
  }

  // Zcash's balance-type step lands before Recipient, so reaching Recipient there
  // goes through the pool choice first instead of `openSendFlowForAccount` alone.
  async function reachRecipientStepViaBalanceType(
    app: Application,
    page: Page,
    accountName: string,
    poolOptionId: "public" | "private",
  ) {
    await openSendFlowForAccount(app, page, accountName);
    await expect(app.newSendFlow.balanceTypeScreen).toBeVisible();
    await app.newSendFlow.selectBalanceType(poolOptionId);
    await expect(app.newSendFlow.recipientInput).toBeVisible();
  }

  test.describe("Recipient Step", () => {
    test("should open dialog with address input visible @smoke", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Verify Recipient step UI", async () => {
        await app.newSendFlow.expectDialogVisible();
        await expect(app.newSendFlow.recipientInput).toBeVisible();
        await app.newSendFlow.expectHeaderTitle("ETH");
      });
    });

    test("should show address matched after typing valid address", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Type valid address", async () => {
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.ethereum);
      });

      await test.step("Verify address matched section appears", async () => {
        await app.newSendFlow.expectAddressMatched();
      });
    });

    test("should show sanctioned banner for sanctioned address", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Type sanctioned address", async () => {
        await app.newSendFlow.typeAddress(Addresses.SANCTIONED_ETHEREUM);
      });

      await test.step("Verify sanctioned banner", async () => {
        await app.newSendFlow.expectSanctionedBanner();
      });
    });

    test("should proceed to Amount step when clicking valid address", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Type and select address", async () => {
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.ethereum);

        await app.newSendFlow.clickOnSendToButton();
      });

      await test.step("Verify Amount step is visible", async () => {
        await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        // Address input should still be visible in header but read-only
        await expect(app.newSendFlow.editRecipientButton).toBeVisible();
      });
    });

    test("should show recent history warning for address with no prior OUT operations", async ({
      app,
      page,
    }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Type an address not present in account OUT operations", async () => {
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.newAddress);
        await app.newSendFlow.waitForRecipientValidation();
      });

      await test.step("Verify recent history warning card is visible", async () => {
        await expect(app.newSendFlow.recentHistoryWarningCard).toBeVisible({ timeout: 5000 });
      });
    });

    test("should resolve ENS domain and allow proceed (EVM)", async ({ app, page }) => {
      await page.route(
        "https://explorers.api.live.ledger.com/blockchain/v4/eth/ens/resolve/**",
        async route => {
          await route.fulfill({
            headers: { teststatus: "mocked" },
            body: TEST_ADDRESSES.ethereum,
          });
        },
      );

      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Type ENS name and wait for validation", async () => {
        await app.newSendFlow.typeAddress("vitalik.eth");
      });

      await test.step("Select resolved address and proceed", async () => {
        await app.newSendFlow.expectAddressMatched();
        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
      });
    });

    test("should allow self-transfer when policy is free (EVM)", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

      await test.step("Type self address and validate", async () => {
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.selfEthereum);
      });

      await test.step("Verify no recipient error and proceed", async () => {
        await expect(app.newSendFlow.recipientErrorBanner).not.toBeVisible();
        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
      });
    });

    test("should block self-transfer when policy is impossible (Tezos)", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.tezos);

      await test.step("Type self address and validate", async () => {
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.selfTezos);
      });

      await test.step("Verify recipient error banner is shown", async () => {
        await expect(app.newSendFlow.recipientErrorBanner).toBeVisible({ timeout: 10000 });
      });
    });

    test("should block self-transfer when policy is impossible (Algorand)", async ({
      app,
      page,
    }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.algorand);

      await test.step("Type account address (self) and validate", async () => {
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.algorand);
      });

      await test.step("Verify recipient error banner is shown", async () => {
        await expect(app.newSendFlow.recipientErrorBanner).toBeVisible({ timeout: 10000 });
      });
    });

    test.describe("Memo skip", () => {
      test("should be able to skip memo input and need to confirm it", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.skipMemoConfirmButton).toBeVisible();
        await app.newSendFlow.confirmSkipMemo();

        await expect(app.newSendFlow.amountInput).toBeVisible();
      });

      test("should go back to the recipient step when refusing to skip memo", async ({
        app,
        page,
      }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.skipMemoConfirmButton).toBeVisible();
        await app.newSendFlow.cancelSkipMemo();

        await expect(app.newSendFlow.skipMemoConfirmButton).toBeHidden();
        await expect(app.newSendFlow.memoInput).toBeVisible();
        await expect(app.newSendFlow.amountInput).toBeHidden();
      });

      test("should not need to confirm skipping memo when parameter is enabled from send modal", async ({
        app,
        page,
      }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.neverAskAgainSkipMemoCheckbox).toBeVisible();
        await app.newSendFlow.checkNeverAskAgainSkipMemo();
        await expect(app.newSendFlow.skipMemoConfirmButton).toBeVisible();
        await app.newSendFlow.confirmSkipMemo();

        await expect(app.newSendFlow.amountInput).toBeVisible();

        await app.newSendFlow.close();

        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.amountInput).toBeVisible();
      });

      test("should not need to confirm skipping memo when parameter is enabled from settings", async ({
        app,
        page,
      }) => {
        await app.layout.goToSettings();
        await app.settings.goToAccountsTab();
        await app.settings.switchNeverAskAgainSkipMemo();

        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.amountInput).toBeVisible();
      });

      test("should need to confirm skipping memo when parameter is disabled from settings", async ({
        app,
        page,
      }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.neverAskAgainSkipMemoCheckbox).toBeVisible();
        await app.newSendFlow.checkNeverAskAgainSkipMemo();
        await expect(app.newSendFlow.skipMemoConfirmButton).toBeVisible();
        await app.newSendFlow.confirmSkipMemo();

        await expect(app.newSendFlow.amountInput).toBeVisible();

        await app.newSendFlow.close();

        await app.layout.goToSettings();
        await app.settings.goToAccountsTab();
        await app.settings.switchNeverAskAgainSkipMemo();

        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);
        await expect(app.newSendFlow.memoInput).toBeVisible();

        await app.newSendFlow.clickOnSendToButton();
        await expect(app.newSendFlow.neverAskAgainSkipMemoCheckbox).toBeVisible();
        await app.newSendFlow.checkNeverAskAgainSkipMemo();
        await expect(app.newSendFlow.skipMemoConfirmButton).toBeVisible();
      });
    });

    test.describe("Memo on Stellar", () => {
      test("should have Memo Text type as default option", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);

        await expect(app.newSendFlow.memoInput).toBeVisible();
        await expect(app.newSendFlow.memoOptionsSelect).toBeVisible();
        await expect(app.newSendFlow.memoOptionsSelect).toHaveText("Memo Text");
      });

      test("should show all Stellar memo types in selector", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
        await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);

        await expect(app.newSendFlow.memoOptionsSelect).toBeVisible();

        await app.newSendFlow.memoOptionsSelect.click();
        await expect(app.newSendFlow.memoOptionNoMemo).toBeVisible();
        await expect(app.newSendFlow.memoOptionText).toBeVisible();
        await expect(app.newSendFlow.memoOptionId).toBeVisible();
        await expect(app.newSendFlow.memoOptionHash).toBeVisible();
        await expect(app.newSendFlow.memoOptionReturn).toBeVisible();
      });

      const memoOptions: { type: StellarMemoType; value: string | undefined; label: string }[] = [
        { type: "NO_MEMO", value: undefined, label: "No Memo" },
        { type: "MEMO_TEXT", value: "some random memo", label: "Memo Text" },
        { type: "MEMO_ID", value: "123456", label: "Memo ID" },
        {
          type: "MEMO_HASH",
          value: "a".repeat(64),
          label: "Memo Hash",
        },
        {
          type: "MEMO_RETURN",
          value: "b".repeat(64),
          label: "Memo Return",
        },
      ];

      memoOptions.forEach(option => {
        test(`should be able to switch to ${option.type}, fill the input and go to the amount step`, async ({
          app,
          page,
        }) => {
          await openSendFlowForAccount(app, page, ACCOUNT_NAMES.stellar);
          await app.newSendFlow.typeAddress(TEST_ADDRESSES.stellar);

          await expect(app.newSendFlow.memoInput).toBeVisible();
          await expect(app.newSendFlow.memoOptionsSelect).toBeVisible();

          if (option.type !== "MEMO_TEXT") {
            await app.newSendFlow.memoOptionsSelect.click();
            await app.newSendFlow.selectMemoType(option.type);
          }

          await expect(app.newSendFlow.memoOptionsSelect).toHaveText(option.label);

          if (option.value !== undefined) {
            await app.newSendFlow.typeMemo(option.value);
            if (option.type === "MEMO_HASH" || option.type === "MEMO_RETURN") {
              await expect(app.newSendFlow.memoInput).toHaveValue(option.value, { timeout: 5000 });
              await app.newSendFlow.sendToButton.waitFor({ state: "visible", timeout: 10000 });
            }
          }

          await app.newSendFlow.clickOnSendToButton();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });
      });
    });
  });

  test.describe("Amount Step", () => {
    test("should show amount input and quick actions @smoke", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await test.step("Verify Amount step UI", async () => {
        await expect(app.newSendFlow.amountInput).toBeVisible();
        await expect(app.newSendFlow.reviewButton).toBeVisible();
      });
    });

    test("should allow entering valid amount", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
      await app.newSendFlow.fillCryptoAmount("0.001");
      await app.newSendFlow.expectReviewEnabled();
    });

    test("should allow entering fiat and crypto amounts", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await test.step("Fill fiat amount (default input mode)", async () => {
        await app.newSendFlow.fillAmount("12.34");
        await app.newSendFlow.expectReviewEnabled();
      });

      await test.step("Fill crypto amount (switches input mode)", async () => {
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.expectReviewEnabled();
      });
    });

    test("should show error for insufficient funds and get funds button", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await test.step("Enter amount exceeding balance", async () => {
        await app.newSendFlow.fillAmount("999999999");
      });

      await app.newSendFlow.expectAmountError();
      await app.newSendFlow.expectGetFundsButton();
    });

    test("should disable review button for zero amount", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await test.step("Enter zero amount", async () => {
        await app.newSendFlow.fillCryptoAmount("0");
      });

      await test.step("Verify review disabled", async () => {
        await app.newSendFlow.expectReviewDisabled();
      });
    });

    test.skip("should set the correct amount when clicking on the amount quick actions", async ({
      app,
      page,
    }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await test.step("Test 25% quick action", async () => {
        await app.newSendFlow.clickQuickAction("25%");
        const amount = await app.newSendFlow.getAmountValue();
        expect(amount).not.toBe("0");
        expect(amount).not.toBe("");
      });
    });

    test("should navigate back to Recipient", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await app.newSendFlow.goBack();

      await test.step("Verify back at Recipient step", async () => {
        await expect(app.newSendFlow.recipientInput).toBeVisible();
        const isEditable = await app.newSendFlow.recipientInput.isEditable();
        expect(isEditable).toBe(true);
      });
    });

    test("should proceed to Signature step when clicking Review", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      const deviceAction = new DeviceAction(page);

      await test.step("Fill crypto amount and review", async () => {
        // Use fillCryptoAmount to switch from default FIAT mode to CRYPTO mode
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.clickReview();
      });

      await app.newSendFlow.waitForSignature();

      await test.step("Complete device action", async () => {
        // Mock device signing the transaction
        await deviceAction.silentSign();
      });

      await app.newSendFlow.waitForSuccessConfirmation();
    });

    test("should allow changing fee presets (EVM)", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

      await test.step("Fill crypto amount", async () => {
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.expectReviewEnabled();
      });

      for (const preset of FEE_PRESETS) {
        await test.step(`Select ${preset} preset`, async () => {
          await app.newSendFlow.selectFeePreset(preset);

          await test.step(`Verifying preset ${preset} is correctly selected`, async () => {
            await expect(app.newSendFlow.feesMenuTrigger).toContainText(new RegExp(preset, "i"));
          });
        });
      }
    });

    test("should allow changing fee presets (BTC)", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);

      await test.step("Fill amount", async () => {
        await app.newSendFlow.fillCryptoAmount("0.0001");
      });

      await test.step("Verify fees menu shows medium by default", async () => {
        await expect(app.newSendFlow.feesMenuTrigger).toContainText(/medium/i);
      });

      for (const preset of FEE_PRESETS) {
        if (preset === "medium") {
          continue;
        }

        await app.newSendFlow.selectFeePreset(preset);
        await test.step(`Verifying preset ${preset} is correctly selected`, async () => {
          await expect(app.newSendFlow.feesMenuTrigger).toContainText(new RegExp(preset, "i"));
        });
      }

      await app.newSendFlow.selectFeePreset("medium");
      await test.step("Verifying preset medium is correctly selected", async () => {
        await expect(app.newSendFlow.feesMenuTrigger).toContainText(/medium/i);
      });
    });

    test("should show warning message when fees exceed 10% of amount (BTC)", async ({
      app,
      page,
    }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);

      const feeTooHighText = page.getByText(/network fees are above 10% of the amount/i).first();

      await test.step("Small amount shows warning", async () => {
        await app.newSendFlow.fillCryptoAmount("0.0001");

        await feeTooHighText.waitFor({ state: "visible" });
        await expect(feeTooHighText).toBeVisible();
      });

      await test.step("Larger amount hides warning", async () => {
        await app.newSendFlow.fillCryptoAmount("0.001");

        await feeTooHighText.waitFor({ state: "hidden" });
        await expect(feeTooHighText).toBeHidden();
      });
    });

    (["bitcoin", "ethereum"] as const).forEach(family => {
      test(`should change max amount when changing fee presets ${family}`, async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES[family], TEST_ADDRESSES[family]);

        await test.step("Select amount max quick action", async () => {
          await app.newSendFlow.clickQuickAction("Max");
          await app.newSendFlow.expectReviewEnabled();
        });

        await test.step("Slow preset yields higher max than Fast", async () => {
          await app.newSendFlow.selectFeePreset("slow");
          await app.newSendFlow.expectReviewEnabled();
          const slowAmount = new BigNumber(await app.newSendFlow.getAmountValue());

          await app.newSendFlow.selectFeePreset("fast");
          await app.newSendFlow.expectReviewEnabled();
          const fastAmount = new BigNumber(await app.newSendFlow.getAmountValue());

          expect(slowAmount.isFinite()).toBe(true);
          expect(fastAmount.isFinite()).toBe(true);
          expect(fastAmount.lt(slowAmount)).toBe(true);
        });
      });
    });

    test("should show custom and coin control options in fees menu (BTC)", async ({
      app,
      page,
    }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
      await app.newSendFlow.fillCryptoAmount("0.0001");
      await app.newSendFlow.openFeesMenu();

      await app.newSendFlow.customFeesMenuItem.waitFor({ state: "visible" });
      await expect(app.newSendFlow.customFeesMenuItem).toBeVisible();

      await app.newSendFlow.coinControlFeesMenuItem.waitFor({ state: "visible" });
      await expect(app.newSendFlow.coinControlFeesMenuItem).toBeVisible();
    });

    test("should show custom fees option in fees menu (EVM)", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
      await app.newSendFlow.fillCryptoAmount("0.001");
      await app.newSendFlow.openFeesMenu();
      await app.newSendFlow.customFeesMenuItem.waitFor({ state: "visible" });
      await expect(app.newSendFlow.customFeesMenuItem).toBeVisible();
    });

    test("should not show fee menu options for Tezos", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.tezos, TEST_ADDRESSES.tezos);
      await app.newSendFlow.fillCryptoAmount("0.1");
      await expect(app.newSendFlow.feesMenuTrigger).toBeHidden();
    });

    test("should not show fee menu options for Algorand", async ({ app, page }) => {
      await reachAmountStep(
        app,
        page,
        ACCOUNT_NAMES.algorand,
        TEST_ADDRESSES.algorandRecipient,
        true,
      );
      await app.newSendFlow.fillCryptoAmount("0.1");
      await expect(app.newSendFlow.feesMenuTrigger).toBeHidden();
    });

    test("should show custom fees only for Stellar", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.stellar, TEST_ADDRESSES.stellar, true);
      await app.newSendFlow.fillCryptoAmount("1");
      await app.newSendFlow.openFeesMenu();
      await expect(app.newSendFlow.customFeesMenuItem).toBeVisible();

      for (const preset of FEE_PRESETS) {
        await expect(app.newSendFlow.getFeePreset(preset)).toBeHidden();
      }
    });

    test("should not show fee menu options for XRP", async ({ app, page }) => {
      await reachAmountStep(app, page, ACCOUNT_NAMES.xrp, TEST_ADDRESSES.xrp, true);
      await app.newSendFlow.fillCryptoAmount("1");
      await expect(app.newSendFlow.feesMenuTrigger).toBeHidden();
    });

    test.describe("Custom Fees", () => {
      test("should open custom fees screen and show feePerByte input (BTC)", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCustomFees();

        await test.step("Verify custom fees screen elements", async () => {
          await expect(app.newSendFlow.customFeesFeePerByteInput).toBeVisible({ timeout: 10000 });
          await expect(app.newSendFlow.customFeesConfirmButton).toBeVisible();
        });
      });

      test("should fill feePerByte, confirm and return to amount step (BTC)", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCustomFees();

        await test.step("Fill custom feePerByte value", async () => {
          await app.newSendFlow.customFeesFeePerByteInput.clear();
          await app.newSendFlow.customFeesFeePerByteInput.fill("5");
        });

        await test.step("Confirm and verify return to amount step", async () => {
          await app.newSendFlow.confirmCustomFees();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });

        await test.step("Verify fees menu shows custom", async () => {
          await expect(app.newSendFlow.feesMenuTrigger).toContainText(/custom/i);
        });
      });

      test("should navigate back from custom fees to amount step (BTC)", async ({ app, page }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCustomFees();

        await expect(app.newSendFlow.customFeesFeePerByteInput).toBeVisible({ timeout: 10000 });

        await app.newSendFlow.goBack();

        await test.step("Verify back at amount step", async () => {
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });
      });

      test("should open custom fees screen and show EIP-1559 inputs (EVM)", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.openCustomFees();

        await test.step("Verify EIP-1559 custom fee inputs", async () => {
          await expect(app.newSendFlow.customFeesMaxPriorityFeeInput).toBeVisible({
            timeout: 10000,
          });
          await expect(app.newSendFlow.customFeesMaxFeeInput).toBeVisible();
          await expect(app.newSendFlow.customFeesConfirmButton).toBeVisible();
        });
      });

      test("should fill EIP-1559 values, confirm and return to amount step (EVM)", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.openCustomFees();

        await test.step("Fill custom EIP-1559 values", async () => {
          await app.newSendFlow.customFeesMaxPriorityFeeInput.clear();
          await app.newSendFlow.customFeesMaxPriorityFeeInput.fill("2");
          await app.newSendFlow.customFeesMaxFeeInput.clear();
          await app.newSendFlow.customFeesMaxFeeInput.fill("50");
        });

        await test.step("Confirm and verify return to amount step", async () => {
          await app.newSendFlow.confirmCustomFees();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });

        await test.step("Verify fees menu shows custom", async () => {
          await expect(app.newSendFlow.feesMenuTrigger).toContainText(/custom/i);
        });
      });

      test("should disable confirm when custom fee value is invalid (BTC)", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCustomFees();

        await test.step("Clear input and verify confirm is disabled", async () => {
          await app.newSendFlow.customFeesFeePerByteInput.clear();
          await expect(app.newSendFlow.customFeesConfirmButton).toBeDisabled();
        });

        await test.step("Fill valid value and verify confirm is enabled", async () => {
          await app.newSendFlow.customFeesFeePerByteInput.fill("3");
          await expect(app.newSendFlow.customFeesConfirmButton).toBeEnabled();
        });
      });

      test("should disable confirm when EVM maxFee is less than maxPriorityFee", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.openCustomFees();

        await test.step("Set maxPriorityFee higher than maxFee", async () => {
          await app.newSendFlow.customFeesMaxPriorityFeeInput.clear();
          await app.newSendFlow.customFeesMaxPriorityFeeInput.fill("100");
          await app.newSendFlow.customFeesMaxFeeInput.clear();
          await app.newSendFlow.customFeesMaxFeeInput.fill("1");
        });

        await test.step("Verify confirm is disabled", async () => {
          await expect(app.newSendFlow.customFeesConfirmButton).toBeDisabled();
        });
      });
    });

    test.describe("Coin Control", () => {
      test("should open coin control screen and show strategy, amount input and footer (BTC)", async ({
        app,
        page,
      }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCoinControl();

        await test.step("Verify coin control screen elements", async () => {
          await expect(app.newSendFlow.coinControlAmountInput).toBeVisible({ timeout: 10000 });
          await expect(app.newSendFlow.coinControlFooter).toBeVisible();
          await expect(app.newSendFlow.coinControlChangeToReturn).toBeVisible();
        });
      });

      test("should navigate back from coin control to amount step (BTC)", async ({ app, page }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCoinControl();

        await expect(app.newSendFlow.coinControlAmountInput).toBeVisible({ timeout: 10000 });

        await app.newSendFlow.goBack();

        await test.step("Verify back at amount step", async () => {
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });
      });

      test("should show review button in coin control footer (BTC)", async ({ app, page }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCoinControl();

        await test.step("Verify review button is present in footer", async () => {
          await expect(
            app.newSendFlow.coinControlFooter.getByTestId("send-review-button"),
          ).toBeVisible({ timeout: 10000 });
        });
      });

      test("should show fee presets in coin control footer (BTC)", async ({ app, page }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.bitcoin, TEST_ADDRESSES.bitcoin);
        await app.newSendFlow.fillCryptoAmount("0.0001");
        await app.newSendFlow.openCoinControl();

        await test.step("Verify fees menu trigger is visible in footer", async () => {
          const feesMenuInFooter = app.newSendFlow.coinControlFooter.getByTestId(
            "send-network-fees-menu-trigger",
          );
          await expect(feesMenuInFooter).toBeVisible({ timeout: 10000 });
        });
      });

      test("should not show coin control option for non-BTC families", async ({ app, page }) => {
        await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.openFeesMenu();

        await test.step("Verify coin control is absent for EVM", async () => {
          await expect(app.newSendFlow.customFeesMenuItem).toBeVisible();
          await expect(app.newSendFlow.coinControlFeesMenuItem).toBeHidden();
        });
      });
    });
  });

  test.describe("Generic Flow Tests", () => {
    // Test data for different families
    const familiesData = [
      {
        name: "Algorand",
        accountName: ACCOUNT_NAMES.algorand,
        address: TEST_ADDRESSES.algorandRecipient,
        amount: "0.1",
        hasMemo: true,
        memoValue: "some random memo",
      },
      {
        name: "Bitcoin",
        accountName: ACCOUNT_NAMES.bitcoin,
        address: TEST_ADDRESSES.bitcoin,
        amount: "0.1",
      },
      {
        name: "Ethereum",
        accountName: ACCOUNT_NAMES.ethereum,
        address: TEST_ADDRESSES.ethereum,
        amount: "0.001",
      },
      {
        name: "Arbitrum",
        accountName: ACCOUNT_NAMES.arbitrum,
        address: TEST_ADDRESSES.arbitrum,
        amount: "0.001",
      },
      {
        name: "Tezos",
        accountName: ACCOUNT_NAMES.tezos,
        address: TEST_ADDRESSES.tezos,
        amount: "0.1",
      },
      {
        name: "Stellar",
        accountName: ACCOUNT_NAMES.stellar,
        address: TEST_ADDRESSES.stellar,
        amount: "1",
        hasMemo: true,
        memoValue: "some random memo",
      },
      {
        name: "XRP",
        accountName: ACCOUNT_NAMES.xrp,
        address: TEST_ADDRESSES.xrp,
        amount: "1",
        hasMemo: true,
        memoValue: "12345",
      },
    ];

    for (const family of familiesData) {
      test(`should complete full flow for ${family.name}`, async ({ app, page }) => {
        const deviceAction = new DeviceAction(page);

        await test.step("Open send flow", async () => {
          await openSendFlowForAccount(app, page, family.accountName);
        });

        await test.step("Complete Recipient step", async () => {
          await app.newSendFlow.typeAddress(family.address);
          if (family.hasMemo === true && family.memoValue) {
            await app.newSendFlow.typeMemo(family.memoValue);
          }

          await app.newSendFlow.clickOnSendToButton();
        });

        await test.step("Complete Amount step", async () => {
          await expect(app.newSendFlow.amountInput).toBeVisible();
          await app.newSendFlow.fillCryptoAmount(family.amount);
          await app.newSendFlow.clickReview();
        });

        await test.step("Wait for signature screen", async () => {
          await app.newSendFlow.waitForSignature();
        });

        await test.step("Complete device action", async () => {
          await deviceAction.silentSign();
        });

        await test.step("Verify confirmation screen", async () => {
          await app.newSendFlow.waitForSuccessConfirmation();
        });
      });
    }
  });

  test.describe("Validation & Errors", () => {
    test("should validate address format - Ethereum", async ({ app, page }) => {
      await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);
      await app.newSendFlow.typeAddress(INVALID_ADDRESSES.ethereum);
      await app.newSendFlow.validationStatusMessage.waitFor({ state: "visible" });
      await expect(app.newSendFlow.validationStatusMessage).toContainText(
        /incorrect address format/i,
      );
    });

    test.describe("Navigation", () => {
      test.describe("Close from any step", () => {
        test("should close from recipient step", async ({ app, page }) => {
          await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);
          await app.newSendFlow.close();
          await expect(app.newSendFlow.dialog).toBeHidden();
        });

        test("should close from amount step", async ({ app, page }) => {
          await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
          await app.newSendFlow.close();
          await expect(app.newSendFlow.dialog).toBeHidden();
        });

        test("should close from signature step", async ({ app, page }) => {
          await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
          await app.newSendFlow.fillCryptoAmount("0.001");
          await app.newSendFlow.clickReview();
          await app.newSendFlow.waitForSignature();
          await app.newSendFlow.close();
          await expect(app.newSendFlow.dialog).toBeHidden();
        });

        test("should close at the end of the workflow", async ({ app, page }) => {
          const deviceAction = new DeviceAction(page);
          await reachAmountStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);
          await app.newSendFlow.fillCryptoAmount("0.001");
          await app.newSendFlow.clickReview();
          await app.newSendFlow.waitForSignature();
          await deviceAction.silentSign();
          await app.newSendFlow.close();
        });
      });

      test("should navigate back and forth", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

        await test.step("Go to Amount step", async () => {
          await app.newSendFlow.typeAddress(TEST_ADDRESSES.ethereum);

          await app.newSendFlow.clickOnSendToButton();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });

        await test.step("Go back to Recipient", async () => {
          await app.newSendFlow.goBack();
          await expect(app.newSendFlow.recipientInput).toBeEditable();
        });

        await test.step("Go to Amount again", async () => {
          await app.newSendFlow.typeAddress(TEST_ADDRESSES.ethereum);

          await app.newSendFlow.clickOnSendToButton();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });
      });

      test("should prefill recipient input when editing from Amount header", async ({
        app,
        page,
      }) => {
        const address = TEST_ADDRESSES.ethereum;
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

        await test.step("Reach Amount step", async () => {
          await app.newSendFlow.typeAddress(address);

          await app.newSendFlow.clickOnSendToButton();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });

        await test.step("Click edit recipient and verify prefill", async () => {
          await app.newSendFlow.editRecipientFromAmountStep();
          await expect(app.newSendFlow.recipientInput).toBeVisible();
          await expect(app.newSendFlow.recipientInput).toHaveValue(address);
        });

        await test.step("Proceed again with same address", async () => {
          await app.newSendFlow.clickOnSendToButton();
          await expect(app.newSendFlow.amountInput).toBeVisible({ timeout: 10000 });
        });
      });
    });

    test.describe("Signature & Confirmation Errors", () => {
      test("should show confirmation info when user refuses on device", async ({ app, page }) => {
        await reachSignatureStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

        await test.step("Simulate user refusal on device", async () => {
          await mockDeviceError(page, "UserRefusedOnDevice");
        });

        await test.step("Verify idle confirmation content", async () => {
          await expect(page.getByText(/action rejected/i)).toBeVisible({ timeout: 10000 });
        });
      });

      test("should show confirmation error when device error occurs", async ({ app, page }) => {
        await reachSignatureStep(app, page, ACCOUNT_NAMES.ethereum, TEST_ADDRESSES.ethereum);

        await test.step("Simulate device disconnection", async () => {
          await mockDeviceError(page, "DisconnectedDevice");
        });

        await test.step("Verify error confirmation screen", async () => {
          await app.newSendFlow.waitForConfirmation();
          await expect(page.getByText(/device disconnected/i)).toBeVisible({ timeout: 10000 });
        });
      });
    });

    test.describe("Edge Cases", () => {
      test("should show security intro card in initial state", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

        await test.step("Verify intro card is visible and accordion is collapsed by default", async () => {
          await expect(app.newSendFlow.introCard).toBeVisible({ timeout: 5000 });
          await expect(app.newSendFlow.securityToggle).toBeVisible();
          // Content should be collapsed by default
          await expect(
            app.newSendFlow.dialog.getByTestId("send-recipient-security-content"),
          ).not.toBeVisible();
        });

        await test.step("Expand accordion and verify content", async () => {
          await app.newSendFlow.securityToggle.click();
          await expect(
            app.newSendFlow.dialog.getByTestId("send-recipient-security-content"),
          ).toBeVisible({ timeout: 3000 });
        });
      });

      test("should transition from invalid to valid address", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

        await test.step("Type invalid address and verify error feedback", async () => {
          await app.newSendFlow.typeAddress(INVALID_ADDRESSES.ethereum);
          await app.newSendFlow.validationStatusMessage.waitFor({ state: "visible" });
          await expect(app.newSendFlow.validationStatusMessage).toContainText(
            /incorrect address format/i,
          );
        });

        await test.step("Type valid address and verify matched", async () => {
          await app.newSendFlow.typeAddress(TEST_ADDRESSES.ethereum);

          await app.newSendFlow.expectAddressMatched();
        });
      });
    });

    test.describe("Feature Flag Regression", () => {
      test.describe("EVM enabled", () => {
        test.use({
          userdata: "1AccountBTC1AccountETH1AccountARB1AccountSOL",
          featureFlags: {
            newSendFlow: {
              enabled: true,
              params: {
                families: ["evm"],
              },
            },
          },
        });

        test("should use new flow when feature flag is enabled for EVM", async ({ app, page }) => {
          await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

          await test.step("Verify new flow dialog is used", async () => {
            await app.newSendFlow.expectDialogVisible();
          });
        });
      });

      test.describe("Feature flag disabled", () => {
        test.use({
          userdata: "1AccountBTC1AccountETH1AccountARB1AccountSOL",
          featureFlags: {
            newSendFlow: {
              enabled: false,
              params: {
                families: [],
              },
            },
          },
        });

        test("should use old flow when feature flag is disabled", async ({ app, page }) => {
          const layout = new Layout(page);
          const accountsPage = new AccountsPage(page);
          const accountPage = new AccountPage(page);

          await test.step("Navigate and open send", async () => {
            await layout.goToAccounts();
            await accountsPage.navigateToAccountByName(ACCOUNT_NAMES.ethereum);
            await accountPage.clickSend();
            await expect(page.getByTestId("modal-container")).toBeVisible({ timeout: 10000 });
          });

          await test.step("Verify old flow modal is used", async () => {
            // With FF disabled, should use old modal
            const hasOldModal = await page
              .getByTestId("modal-container")
              .isVisible()
              .catch(() => false);
            const hasNewDialog = await app.newSendFlow.dialog.isVisible().catch(() => false);
            expect(hasOldModal).toBe(true);
            expect(hasNewDialog).toBe(false);
          });
        });
      });

      test.describe("Family-specific flag", () => {
        test.use({
          userdata: "1AccountBTC1AccountETH1AccountARB1AccountSOL",
          featureFlags: {
            newSendFlow: {
              enabled: true,
              params: {
                families: ["evm"],
              },
            },
          },
        });

        test("should respect family-specific feature flag for EVM", async ({ app, page }) => {
          await test.step("Test Ethereum (enabled)", async () => {
            await openSendFlowForAccount(app, page, ACCOUNT_NAMES.ethereum);

            // Should use new flow for EVM
            await app.newSendFlow.expectDialogVisible();
          });
        });
      });
    });
  });

  test.describe("Zcash", () => {
    test.describe("Shielded path inactive", () => {
      test.use({
        userdata: "1AccountZEC",
        featureFlags: {
          ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
          newSendFlow: {
            enabled: true,
            params: {
              families: [
                "tezos",
                "tron",
                "evm",
                "near",
                "solana",
                "algorand",
                "stellar",
                "xrp",
                "bitcoin",
                "kaspa",
              ],
            },
          },
          zcashShielded: { enabled: false },
        },
      });

      test("should send t→t with no balance-type step", async ({ app, page }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.zcash);

        await test.step("Verify no balance-type step, Recipient step directly visible", async () => {
          await expect(app.newSendFlow.balanceTypeScreen).not.toBeVisible();
          await expect(app.newSendFlow.recipientInput).toBeVisible();
        });

        await app.newSendFlow.reachAmountStep(TEST_ADDRESSES.zcashTransparent);

        const deviceAction = new DeviceAction(page);
        await test.step("Fill amount and review", async () => {
          await app.newSendFlow.fillCryptoAmount("0.001");
          await app.newSendFlow.clickReview();
        });

        await app.newSendFlow.waitForSignature();

        await test.step("Complete device action", async () => {
          await deviceAction.silentSign();
        });

        await app.newSendFlow.waitForSuccessConfirmation();
      });
    });

    // With the shielded path inactive, resolveFamily() falls back to the Bitcoin
    // descriptor (fees.hasPresets/hasCustom/hasCoinControl all true), so fee
    // presets/custom fees/coin control are expected to be reachable here, exactly
    // as for any Bitcoin-family send. The "no fee affordance" assertion only
    // holds once the shielded path is active and the Zcash descriptor applies.
    test.describe("Shielded path active", () => {
      test.use({
        userdata: "1AccountZEC",
        featureFlags: {
          ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
          newSendFlow: {
            enabled: true,
            params: {
              families: [
                "tezos",
                "tron",
                "evm",
                "near",
                "solana",
                "algorand",
                "stellar",
                "xrp",
                "bitcoin",
                "kaspa",
              ],
            },
          },
          zcashShielded: { enabled: true },
        },
      });

      test("should show the balance-type step and complete t→t after choosing Transparent", async ({
        app,
        page,
      }) => {
        await openSendFlowForAccount(app, page, ACCOUNT_NAMES.zcash);

        await test.step("Verify balance-type step shows both pool options", async () => {
          await expect(app.newSendFlow.balanceTypeScreen).toBeVisible();
          await expect(app.newSendFlow.balanceTypeOption("public")).toBeVisible();
          await expect(app.newSendFlow.balanceTypeOption("private")).toBeVisible();
        });

        await app.newSendFlow.selectBalanceType("public");
        await app.newSendFlow.reachAmountStep(TEST_ADDRESSES.zcashTransparent);

        const deviceAction = new DeviceAction(page);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.clickReview();
        await app.newSendFlow.waitForSignature();
        await deviceAction.silentSign();
        await app.newSendFlow.waitForSuccessConfirmation();
      });

      test("should complete t→z after choosing Transparent and a private recipient", async ({
        app,
        page,
      }) => {
        await reachRecipientStepViaBalanceType(app, page, ACCOUNT_NAMES.zcash, "public");
        // A shielded recipient enables the memo field, so the skip-memo confirmation
        // is shown before the amount step.
        await app.newSendFlow.reachAmountStep(TEST_ADDRESSES.zcashOrchard, true);

        const deviceAction = new DeviceAction(page);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.clickReview();
        await app.newSendFlow.waitForSignature();
        await deviceAction.silentSign();
        await app.newSendFlow.waitForSuccessConfirmation();
      });

      test("should complete z→t after choosing Shielded and a public recipient", async ({
        app,
        page,
      }) => {
        await reachRecipientStepViaBalanceType(app, page, ACCOUNT_NAMES.zcash, "private");
        await app.newSendFlow.reachAmountStep(TEST_ADDRESSES.zcashTransparent);

        const deviceAction = new DeviceAction(page);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.clickReview();
        await app.newSendFlow.waitForSignature();
        await deviceAction.silentSign();
        await app.newSendFlow.waitForSuccessConfirmation();
      });

      test("should complete z→z after choosing Shielded and a private recipient", async ({
        app,
        page,
      }) => {
        await reachRecipientStepViaBalanceType(app, page, ACCOUNT_NAMES.zcash, "private");
        // A shielded recipient enables the memo field, so the skip-memo confirmation
        // is shown before the amount step.
        await app.newSendFlow.reachAmountStep(TEST_ADDRESSES.zcashOrchard, true);

        const deviceAction = new DeviceAction(page);
        await app.newSendFlow.fillCryptoAmount("0.001");
        await app.newSendFlow.clickReview();
        await app.newSendFlow.waitForSignature();
        await deviceAction.silentSign();
        await app.newSendFlow.waitForSuccessConfirmation();
      });

      test("should block a Sapling (zs1…) recipient with ZcashSaplingRecipientNotSupported", async ({
        app,
        page,
      }) => {
        await reachRecipientStepViaBalanceType(app, page, ACCOUNT_NAMES.zcash, "private");

        await test.step("Type Sapling address and verify it is blocked", async () => {
          await app.newSendFlow.typeAddress(TEST_ADDRESSES.zcashSapling);
          await expect(app.newSendFlow.recipientErrorBanner).toBeVisible({ timeout: 10000 });
          await expect(app.newSendFlow.recipientErrorBanner).toContainText(
            "Sending to Sapling addresses is not supported",
          );
        });
      });

      test("should not show fee-selection, custom-fee, or coin-control affordances in any pool selection", async ({
        app,
        page,
      }) => {
        for (const poolOptionId of ["public", "private"] as const) {
          await test.step(`Pool: ${poolOptionId}`, async () => {
            await reachRecipientStepViaBalanceType(app, page, ACCOUNT_NAMES.zcash, poolOptionId);
            await app.newSendFlow.reachAmountStep(TEST_ADDRESSES.zcashTransparent);
            await app.newSendFlow.fillCryptoAmount("0.001");
            // Anchor: the fees row itself must be mounted, so the following absence
            // assertions are checked against a rendered step rather than one not there yet.
            await expect(page.getByTestId("send-network-fees-row")).toBeVisible();
            await expect(app.newSendFlow.feesMenuTrigger).toBeHidden();
            await expect(app.newSendFlow.customFeesMenuItem).toBeHidden();
            await expect(app.newSendFlow.coinControlFeesMenuItem).toBeHidden();
            await app.newSendFlow.closeButton.click();
          });
        }
      });
    });
  });
});
