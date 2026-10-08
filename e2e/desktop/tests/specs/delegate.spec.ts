import { test, type CliCommand } from "tests/fixtures/common";
import { delegateTeamOwner } from "@ledgerhq/live-e2e-shared/data/delegateTeamOwner";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import {
  MINA_DELEGATION_PAIR,
  MINA_REDELEGATION_ACCOUNT,
  MINA_PAIR_SYNC_TIMEOUT_MS,
  pickMinaAccountToDelegate,
  pickMinaRedelegation,
  pickMinaValidator,
} from "@ledgerhq/live-e2e-shared/families/minaStakingState";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import type { PartialFeatures } from "@shared/feature-flags";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import {
  liveDataCommand,
  liveDataWithAddressCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  FF_BABYLON_STAKING_ENABLED,
  FF_MINA_STAKING_ENABLED,
  FF_STAKE_PROGRAMS_MODAL,
} from "tests/utils/featureFlagUtils";
import type { Application } from "tests/page";
import type { DelegateTxType } from "tests/page/drawer/delegate.drawer";
import { buildTags, deviceTagsWithoutLNS } from "tests/utils/tagsUtils";
import { skipSharedAccountOnSecondaryLeg } from "tests/utils/sharedAccountUtils";

const DISABLE_BROADCAST_ENV = { DISABLE_TRANSACTION_BROADCAST: "1" };
// `getEnv` does not read process.env in the test runner, so it would always return the default here.
// The app broadcasts only when the run sets "0" (see the electronApp fixture).
const IS_BROADCAST_RUN = process.env.DISABLE_TRANSACTION_BROADCAST === "0";

function useDelegateFixtures(
  currency: Currency,
  {
    cliCommands,
    featureFlags,
    disableBroadcast = false,
  }: { cliCommands: CliCommand[]; featureFlags?: PartialFeatures; disableBroadcast?: boolean },
) {
  test.use({
    teamOwner: delegateTeamOwner(currency.id),
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: currency.speculosApp,
    cliCommands,
    featureFlags,
    ...(disableBroadcast && { env: DISABLE_BROADCAST_ENV }),
  });
}

function ticketAnnotations({ xrayTicket, bugTicket }: { xrayTicket: string; bugTicket?: string }) {
  return [
    { type: "TMS", description: xrayTicket },
    ...(bugTicket ? [{ type: "BUG", description: bugTicket }] : []),
  ];
}

/** Lock name shared by tests that broadcast from `account`, so they never race on its nonce. */
function accountLock(account: Account) {
  return `account:${account.currency.id}:${account.accountPath}`;
}

async function openAccount(app: Application, account: Account) {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(account.accountName);
}

/**
 * How the provider step of a delegation is completed.
 * - preselected: the first provider is already selected, only its name is checked.
 * - search: the provider is searched, then picked by name.
 * - pickByName: the provider is picked by name from the visible list.
 */
type ProviderStep = "preselected" | "search" | "pickByName";

type DelegateScenario = {
  delegate: Delegate;
  xrayTicket: string;
  transactionType: DelegateTxType;
  providerStep: ProviderStep;
  /** The flow opens on a step that only needs Continue before the provider list. */
  hasIntroStep?: boolean;
  requiresExpertMode?: boolean;
  supportsLNS?: boolean;
  disableBroadcast?: boolean;
  bugTicket?: string;
  featureFlags?: PartialFeatures;
};

const delegateScenarios: DelegateScenario[] = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2740",
    transactionType: "Delegated",
    providerStep: "preselected",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2741",
    transactionType: "Staked",
    providerStep: "preselected",
  },
  {
    delegate: new Delegate(Account.INJ_1, "0.0000001", "Ledger by Bitwise"),
    xrayTicket: "B2CQA-3021",
    transactionType: "Delegated",
    providerStep: "preselected",
    requiresExpertMode: true,
  },
  {
    delegate: new Delegate(Account.OSMO_1, "0.0001", "Ledger by Figment"),
    xrayTicket: "B2CQA-3022",
    transactionType: "Delegated",
    providerStep: "search",
  },
  {
    delegate: new Delegate(Account.BABY_1, "0.001", "Figment"),
    xrayTicket: "B2CQA-6679",
    transactionType: "Delegated",
    providerStep: "search",
    featureFlags: FF_BABYLON_STAKING_ENABLED,
  },
  {
    delegate: new Delegate(Account.SUI_1, "1", "Ledger by P2P.ORG"),
    xrayTicket: "B2CQA-6115",
    transactionType: "Delegated",
    providerStep: "preselected",
    supportsLNS: false,
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_1, "1", "Figment"),
    xrayTicket: "B2CQA-3020",
    transactionType: "Delegated",
    providerStep: "search",
    hasIntroStep: true,
    supportsLNS: false,
    disableBroadcast: true,
  },
  {
    delegate: new Delegate(Account.SOL_2, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2742",
    transactionType: "Delegated",
    providerStep: "pickByName",
    hasIntroStep: true,
    disableBroadcast: true,
  },
];

async function completeProviderStep(app: Application, provider: string, step: ProviderStep) {
  switch (step) {
    case "preselected":
      await app.delegate.verifyFirstProviderName(provider);
      break;
    case "search":
      await app.delegate.inputProvider(provider);
      await app.delegate.selectProviderByName(provider);
      break;
    case "pickByName":
      await app.delegate.selectProviderByName(provider);
      break;
  }
}

for (const scenario of delegateScenarios) {
  const { delegate } = scenario;
  const { currency } = delegate.account;

  test.describe("Delegate", () => {
    useDelegateFixtures(currency, {
      cliCommands: [liveDataCommand(delegate.account)],
      featureFlags: scenario.featureFlags,
      disableBroadcast: scenario.disableBroadcast,
    });

    test(
      `[${currency.testLabel}] - Delegate`,
      {
        tag: buildTags({ currencyId: currency.id, skipLNS: scenario.supportsLNS === false }),
        annotation: ticketAnnotations(scenario),
      },
      async ({ app }) => {
        await openAccount(app, delegate.account);

        if (scenario.requiresExpertMode) {
          await app.speculos.activateExpertMode();
        }

        await app.account.startStakingFlowFromMainStakeButton();
        if (scenario.hasIntroStep) {
          await app.delegate.continue();
        }
        await completeProviderStep(app, delegate.provider, scenario.providerStep);
        await app.delegate.continue();
        await app.delegate.fillAmount(delegate.amount);
        await app.delegate.continue();

        await app.speculos.signDelegationTransaction(delegate);
        await app.delegate.verifySuccessMessage();
        await app.delegate.clickViewDetailsButton();

        await app.delegateDrawer.verifyDelegationSummary(delegate, scenario.transactionType);
        await app.drawer.closeDrawer();

        if (IS_BROADCAST_RUN && !scenario.disableBroadcast) {
          await app.layout.syncAccounts();
          await app.account.clickOnLastOperationAndReturnStatus();
          await app.delegateDrawer.expectDelegationInfos(delegate);
          await app.delegateDrawer.verifyTxTypeIs(scenario.transactionType);
          await app.delegateDrawer.operationTypeIsCorrect(scenario.transactionType);
        }
      },
    );
  });
}

test.describe("Delegate", () => {
  const delegation = new Delegate(Account.ADA_1, "0.01", "Ledger by Figment 3");
  const { currency } = delegation.account;
  useDelegateFixtures(currency, {
    cliCommands: [liveDataCommand(delegation.account)],
    disableBroadcast: true,
  });

  test(
    `[${currency.testLabel}] - Delegate`,
    {
      tag: buildTags({ currencyId: currency.id }),
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-3023" }),
    },
    async ({ app }) => {
      await openAccount(app, delegation.account);
      await app.account.startStakingFlowFromMainStakeButton();

      await app.delegate.continue();
      await app.delegate.openSearchProviderModal();
      await app.delegate.inputProvider(delegation.provider);
      await app.delegate.selectProviderByName(delegation.provider);
      await app.delegate.continue();
      await app.delegate.verifyValidatorName("Ledger by Figment 3 [LBF3]");
      await app.delegate.verifyFeesVisible();
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(delegation);
      await app.delegate.verifySuccessMessage();
    },
  );
});

test.describe("Delegate", () => {
  const seiDelegation = new Delegate(Account.SEI_EVM_1, "1", "first-available");
  const { currency } = seiDelegation.account;
  useDelegateFixtures(currency, {
    cliCommands: [liveDataWithAddressCommand(seiDelegation.account, { currency: "sei_evm" })],
    featureFlags: {
      evmNativeStaking: {
        enabled: true,
        params: { supportedCurrencyIds: ["sei_evm"] },
      },
      ...FF_STAKE_PROGRAMS_MODAL,
    },
  });

  test(
    `[${currency.testLabel}] - Delegate`,
    {
      tag: [...deviceTagsWithoutLNS(), "@sei_evm", "@family-evm"],
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-5740" }),
    },
    async ({ app }) => {
      await openAccount(app, seiDelegation.account);

      await app.account.startStakingFlowFromMainStakeButton();
      await app.evmDelegate.continueFromRewardsInfoIfPresent();
      await app.evmDelegate.expectValidatorListVisible();
      await app.evmDelegate.selectFirstValidator();
      await app.evmDelegate.continueValidatorStep();
      await app.evmDelegate.setAmountAndContinue(seiDelegation.amount);

      await app.speculos.acceptEnableTransactionCheck();

      await app.evmDelegate.expectDeviceValidationScreen();
      await app.speculos.signEvmContractTransaction();
      await app.evmDelegate.expectSuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();

      await app.delegateDrawer.providerIsVisible(seiDelegation);
      await app.delegateDrawer.amountValueIsVisible(currency.ticker);
      await app.delegateDrawer.operationTypeIsCorrect("Delegated");
      await app.drawer.closeDrawer();
    },
  );
});

const celoStaking = new Delegate(Account.CELO_1, "0.001", "N/A");

// Lock and Vote spend from the same account, and the Celo bridge reads its nonce from the latest
// block: run in parallel, the second transaction reuses the first one's nonce and is rejected.
test.describe("Lock and vote - CELO", { lock: accountLock(celoStaking.account) }, () => {
  const { currency } = celoStaking.account;
  useDelegateFixtures(currency, { cliCommands: [liveDataCommand(celoStaking.account)] });

  test(
    `[${currency.testLabel}] - Lock`,
    {
      tag: buildTags({ currencyId: currency.id, skipLNS: true }),
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-3042" }),
    },
    async ({ app }) => {
      await openAccount(app, celoStaking.account);
      await app.account.startStakingFlowFromMainStakeButton();
      await app.delegate.checkCeloManageAssetModal();
      await app.delegate.clickCeloLockButton();
      await app.delegate.fillAmount(celoStaking.amount);
      await app.delegate.verifyLockInfoCeloWarning();
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(celoStaking);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.delegateDrawer.verifyOperationType("Locked");
      await app.delegateDrawer.providerIsVisible(celoStaking);
      await app.drawer.closeDrawer();
    },
  );

  test(
    `[${currency.testLabel}] - Vote`,
    {
      tag: buildTags({ currencyId: currency.id, skipLNS: true }),
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-201" }),
    },
    async ({ app }) => {
      await openAccount(app, celoStaking.account);
      await app.account.startStakingFlowFromMainStakeButton();
      await app.delegate.checkCeloManageAssetModal();
      await app.delegate.clickCeloVoteButton();
      const validatorGroup = await app.delegate.selectProviderOnRow(1);
      await app.delegate.continue();
      await app.delegate.fillAmount(celoStaking.amount);
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(celoStaking);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.delegateDrawer.verifyOperationType("Voted");
      await app.delegateDrawer.validatorGroupIsVisible(validatorGroup);
      await app.drawer.closeDrawer();
    },
  );
});

/**
 * How the validator list behaves when the staking flow opens, which drives how the test selects one.
 * - preselected: the first provider is already chosen and Continue is enabled.
 * - listedByRow: Continue is disabled and the list is picked by row (the provider is the row number).
 * - listedByName: Continue is disabled and the list is picked by provider name.
 * - searchable: the full list is expanded, Continue is disabled until a validator is searched and picked
 *   (Osmosis, Babylon).
 * - asyncPreselected: the first provider is auto-selected asynchronously (Cardano).
 */
type ValidatorSelection =
  | "preselected"
  | "listedByRow"
  | "listedByName"
  | "searchable"
  | "asyncPreselected";

type ValidatorSelectionScenario = {
  delegate: Delegate;
  xrayTicket: string;
  selection: ValidatorSelection;
  supportsLNS?: boolean;
  bugTicket?: string;
  featureFlags?: PartialFeatures;
};

const validatorSelectionScenarios: ValidatorSelectionScenario[] = [
  {
    delegate: new Delegate(Account.ATOM_2, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2731",
    selection: "preselected",
  },
  {
    delegate: new Delegate(Account.SOL_3, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2764",
    selection: "listedByName",
  },
  {
    delegate: new Delegate(Account.NEAR_2, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2732, B2CQA-2765",
    selection: "preselected",
  },
  {
    delegate: new Delegate(Account.ADA_2, "0.01", "Ledger by Figment"),
    xrayTicket: "B2CQA-2766",
    selection: "asyncPreselected",
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_2, "1", "1"),
    xrayTicket: "B2CQA-2767",
    selection: "listedByRow",
    supportsLNS: false,
  },
  {
    delegate: new Delegate(Account.OSMO_2, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2768",
    selection: "searchable",
  },
  {
    delegate: new Delegate(Account.BABY_2, "1", "Figment"),
    xrayTicket: "B2CQA-6678",
    selection: "searchable",
    featureFlags: FF_BABYLON_STAKING_ENABLED,
  },
];

async function selectValidator(
  app: Application,
  { provider }: Delegate,
  selection: ValidatorSelection,
) {
  switch (selection) {
    case "listedByRow": {
      const row = Number.parseInt(provider, 10);
      await app.delegate.verifyContinueDisabled();
      await app.delegate.checkValidatorListIsVisible();
      await app.delegate.selectProviderOnRow(row);
      await app.delegate.closeProviderList(row);
      break;
    }
    case "listedByName":
      await app.delegate.verifyContinueDisabled();
      await app.delegate.selectProviderByName(provider);
      await app.delegate.verifyProviderTC(provider);
      break;
    case "asyncPreselected":
      // Cardano auto-selects the first validator asynchronously and only enables Continue
      // once the bridge finishes recomputing the transaction status. The provider row renders
      // before that recompute settles, so asserting Continue right after the name is flaky.
      // Explicitly (re)select the provider to force a clean, settled transaction update.
      await app.delegate.verifyFirstProviderName(provider);
      await app.delegate.selectProviderByName(provider);
      break;
    case "searchable":
      await app.delegate.verifyContinueDisabled();
      await app.delegate.checkValidatorListIsVisible();
      await app.delegate.inputProvider(provider);
      await app.delegate.selectProviderByName(provider);
      break;
    case "preselected":
      await app.delegate.verifyFirstProviderName(provider);
      await app.delegate.verifyContinueEnabled();
      break;
  }
}

for (const scenario of validatorSelectionScenarios) {
  const { delegate } = scenario;
  const { currency } = delegate.account;

  test.describe("Select a validator", () => {
    useDelegateFixtures(currency, {
      cliCommands: [liveDataCommand(delegate.account)],
      featureFlags: scenario.featureFlags,
    });

    test(
      `[${currency.testLabel}] - Select validator`,
      {
        tag: buildTags({ currencyId: currency.id, skipLNS: scenario.supportsLNS === false }),
        annotation: ticketAnnotations(scenario),
      },
      async ({ app }) => {
        await openAccount(app, delegate.account);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.delegate.continue();

        await selectValidator(app, delegate, scenario.selection);
        await app.delegate.verifyProvider(1);
        if (scenario.selection === "searchable") {
          await app.delegate.clearProviderSearch();
        } else {
          await app.delegate.openSearchProviderModal();
        }
        await app.delegate.checkValidatorListIsVisible();
        await app.delegate.selectProviderOnRow(2);
        await app.delegate.closeProviderList(2);
      },
    );
  });
}

test.describe("Delegate from market", () => {
  const delegation = new Delegate(Account.ATOM_1, "0.001", "Ledger by Bitwise");
  const { currency } = delegation.account;
  useDelegateFixtures(currency, { cliCommands: [liveDataCommand(delegation.account)] });

  test(
    `[${currency.testLabel}] - Delegate from market entry point`,
    {
      tag: buildTags({ currencyId: currency.id }),
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-2771" }),
    },
    async ({ app }) => {
      await app.marketBanner.clickExploreMarketHeader();
      // The asset-discoverability Market has no search input and no per-row stake CTA: staking is
      // reached by opening the asset detail page. Both entry points open the same stake flow.
      if (await app.market.isLegacyMarketList()) {
        await app.market.search(currency.ticker);
        await app.market.stakeButtonClick(currency.ticker);
      } else {
        await app.market.openCoinPage(currency.ticker);
        await app.assetDetail(currency.id).startEarnFlow();
      }

      const selector = await getModularSelector(app, "ACCOUNT");
      if (selector) {
        await selector.selectAccount(delegation.account);
      } else {
        await app.assetDrawer.selectAccountByIndex(delegation.account);
      }

      await app.delegate.verifyFirstProviderName(delegation.provider);
      await app.delegate.continue();
    },
  );
});

const stakingLiveAppScenarios = [
  {
    delegate: new Delegate(Account.TRX_1, "1", "yield.xyz"),
    xrayTicket: "B2CQA-3025",
  },
  {
    delegate: new Delegate(Account.DOT_1, "1", "yield.xyz"),
    xrayTicket: "B2CQA-3026",
  },
];

for (const scenario of stakingLiveAppScenarios) {
  const { delegate } = scenario;
  const { currency } = delegate.account;

  test.describe("Staking live app", () => {
    useDelegateFixtures(currency, { cliCommands: [liveDataCommand(delegate.account)] });

    test(
      `[${currency.testLabel}] - Open staking live app`,
      {
        tag: buildTags({ currencyId: currency.id }),
        annotation: ticketAnnotations(scenario),
      },
      async ({ app }) => {
        await openAccount(app, delegate.account);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.liveApp.verifyLiveAppTitle(delegate.provider);
      },
    );
  });
}

// Tests are skipped while waiting for LIVE-37757 to be done
test.describe.skip("Delegate - MINA", () => {
  test.slow();
  skipSharedAccountOnSecondaryLeg("Mina delegate");

  // Broadcasting is left to the nightly policy: this flow delegates the free account of the pair,
  // which the undelegate flow replaces.
  useDelegateFixtures(Currency.MINA, {
    // Either account of the pair can be the free one, so both are seeded. Seeding also resolves
    // their address, which the picker reads back rather than deriving it from the device itself.
    cliCommands: MINA_DELEGATION_PAIR.map(account => liveDataWithAddressCommand(account)),
    featureFlags: FF_MINA_STAKING_ENABLED,
  });

  test(
    `[${Currency.MINA.testLabel}] - Delegate`,
    {
      // The Nano S build of the Mina app stops at 1.4.2, before the delegation flow.
      tag: buildTags({ currencyId: Currency.MINA.id, skipLNS: true }),
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-6626" }),
    },
    async ({ app }) => {
      const { account } = await pickMinaAccountToDelegate();
      const validator = await pickMinaValidator();
      // Mina delegates the whole balance, so the flow carries no amount.
      const delegation = new Delegate(account, "N/A", validator.name, validator.address);

      await openAccount(app, account);

      await app.account.startStakingFlowFromMainStakeButton({
        timeout: MINA_PAIR_SYNC_TIMEOUT_MS,
      });
      await app.delegate.checkValidatorListIsVisible();
      await app.delegate.inputProvider(delegation.provider);
      await app.delegate.selectProviderByName(delegation.provider);
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(delegation);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.delegateDrawer.verifyOperationType("Delegated");
      await app.delegateDrawer.verifyAccountName(account.accountName);
      // A mina delegation moves no value: the amount shown is the fee.
      await app.delegateDrawer.amountValueIsVisible(Currency.MINA.ticker);
      await app.drawer.closeDrawer();
    },
  );
});

// Tests are skipped while waiting for LIVE-37757 to be done
test.describe.skip("Redelegate - MINA", () => {
  test.slow();
  skipSharedAccountOnSecondaryLeg("Mina redelegate");

  // Broadcasting is left to the nightly policy: moving a delegation leaves the account delegated,
  // so this flow reproduces its own precondition on an account no other flow touches.
  useDelegateFixtures(Currency.MINA, {
    cliCommands: [liveDataWithAddressCommand(MINA_REDELEGATION_ACCOUNT)],
    featureFlags: FF_MINA_STAKING_ENABLED,
  });

  test(
    `[${Currency.MINA.testLabel}] - Redelegate`,
    {
      // The Nano S build of the Mina app stops at 1.4.2, before the delegation flow.
      tag: buildTags({ currencyId: Currency.MINA.id, skipLNS: true }),
      annotation: ticketAnnotations({ xrayTicket: "B2CQA-6627" }),
    },
    async ({ app }) => {
      const { account, validatorAddress } = await pickMinaRedelegation();
      const validator = await pickMinaValidator(validatorAddress);
      const delegation = new Delegate(account, "N/A", validator.name, validator.address);

      await openAccount(app, account);

      await app.layout.waitForSyncButtonToBeEnabled({ slowSync: true });
      await app.delegate.openRedelegateFromManageMenu(Currency.MINA.id);
      await app.delegate.checkValidatorListIsVisible();
      await app.delegate.inputProvider(delegation.provider);
      await app.delegate.selectProviderByName(delegation.provider);
      await app.delegate.continue();

      await app.speculos.signDelegationTransaction(delegation);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.delegateDrawer.verifyOperationType("Redelegated");
      await app.delegateDrawer.verifyAccountName(account.accountName);
      await app.delegateDrawer.amountValueIsVisible(Currency.MINA.ticker);
      await app.drawer.closeDrawer();
    },
  );
});
