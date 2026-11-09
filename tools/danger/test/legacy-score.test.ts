import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classify, computeLegacyScore, formatReport, scoreEmoji } from "../legacy-score.ts";
import { legacyHeavyPr } from "./legacy-score-fixtures.ts";

describe("classify", () => {
  it("counts the new layers per package", () => {
    assert.deepEqual(classify("domain/entity/contact/src/schema.ts"), {
      area: "new",
      label: "domain/entity/contact",
    });
    assert.deepEqual(classify("features/flow/pay-card/src/View.tsx"), {
      area: "new",
      label: "features/flow/pay-card",
    });
    assert.equal(classify("shared/ui-qr-code/src/index.ts")?.area, "new");
  });

  it("counts libs and app feature folders as legacy", () => {
    assert.deepEqual(classify("libs/ledger-live-common/src/exchange/a.ts"), {
      area: "legacy",
      label: "libs/ledger-live-common",
    });
    assert.equal(classify("apps/ledger-live-desktop/src/renderer/hooks/a.ts")?.area, "legacy");
    assert.equal(
      classify("apps/ledger-live-desktop/src/mvvm/features/Perps/a.tsx")?.area,
      "legacy",
    );
    assert.equal(classify("apps/ledger-live-mobile/src/mvvm/features/Perps/a.tsx")?.area, "legacy");
    assert.equal(classify("apps/ledger-live-mobile/src/screens/Foo/index.tsx")?.area, "legacy");
    assert.equal(classify("apps/ledger-live-mobile/src/components/Foo.tsx")?.area, "legacy");
    assert.equal(classify("apps/ledger-live-mobile/src/logic/foo.ts")?.area, "legacy");
    assert.equal(classify("apps/ledger-live-mobile/src/mvvm/hooks/useFoo.ts")?.area, "legacy");
    assert.equal(classify("apps/ledger-live-desktop/src/mvvm/hooks/useFoo.ts")?.area, "legacy");
    assert.equal(
      classify("features/platform/device-mock-server/src/mockServerApi.ts")?.area,
      "new",
    );
  });

  it("ignores app composition, coin modules, tooling and the allowlist", () => {
    for (const path of [
      "apps/ledger-live-mobile/src/navigation/Root.tsx",
      "apps/ledger-live-mobile/src/families/evm/a.tsx",
      "apps/ledger-live-mobile/src/AppProviders.tsx",
      "apps/ledger-live-mobile/src/state-manager/configureStore.ts",
      "libs/live-e2e-shared/src/speculos.ts",
      "libs/coin-tester-modules/coin-tester-evm/src/a.ts",
      "libs/ledger-live-common/src/account-data/coin-module/createCoinModuleHost.ts",
      "apps/ledger-live-desktop/src/main/index.ts",
      "apps/ledger-live-desktop/src/renderer/init.tsx",
      "apps/ledger-live-desktop/src/renderer/live-common-setup-renderer.ts",
      "apps/ledger-live-desktop/src/renderer/families/evm/a.tsx",
      "apps/wallet-cli/src/a.ts",
      "libs/coin-modules/coin-evm/src/a.ts",
      "libs/ledger-live-common/src/account-data/full-sync/balance.ts",
      "tools/danger/legacy-score.ts",
      "support/jest/index.ts",
      "devtools/shell/src/a.tsx",
    ]) {
      assert.equal(classify(path), null, path);
    }
  });

  it("ignores tests, declarations and non TypeScript files", () => {
    for (const path of [
      "libs/ledger-live-common/src/a.test.ts",
      "libs/ledger-live-common/src/__tests__/a.ts",
      "libs/ledger-live-common/src/wallet-api/Exchange/quotes/fixtures/rawQuotes.ts",
      "domain/api/swap-quotes/src/fixtures/rawQuotes.ts",
      "apps/ledger-live-mobile/src/mvvm/features/X/__integrations__/a.tsx",
      "libs/ledger-live-common/src/a.d.ts",
      "shared/ui-qr-code/src/QrCode.stories.tsx",
      "libs/ledger-live-common/src/families/evm/common.fixtures.ts",
      "features/flow/pay-card-details/src/components/More/fixtures.ts",
      "domain/entity/account-descriptor/src/test-fixtures.ts",
      "domain/api/account-data/src/testing.ts",
      "libs/ledger-wallet-framework/src/test-helpers/bridge-integration-suite.ts",
      "apps/ledger-live-desktop/src/mvvm/features/X/hooks/testHelpers/renderHookWithStore.tsx",
      "apps/ledger-live-mobile/src/mvvm/features/Portfolio/utils/recoverTestHelpers.ts",
      "libs/live-dmk-desktop/tests.setup.ts",
      "domain/entity/market-countervalues/src/mock.ts",
      "libs/ledger-live-common/src/exchange/swap/mock.ts",
      "features/platform/assets-table/src/testing/mockAssetsTablePorts.tsx",
      "apps/ledger-live-mobile/src/mvvm/features/NotificationsPrompt/testUtils.ts",
      "apps/ledger-live-desktop/src/mvvm/features/CryptoAddresses/testUtils/createWalletState.ts",
      "libs/live-dmk-shared/src/device-action/__test-utils__/makeInternalApi.ts",
      "libs/ledgerjs/packages/hw-app-exchange/src/setupTests.ts",
      "libs/ledger-live-common/jest.config.ts",
      "libs/ledger-live-common/src/generated/types.ts",
      "libs/live-dmk-speculos/src/index.ts",
      "libs/disable-network-setup/src/index.ts",
      "libs/ledger-live-common/src/mocks/account.ts",
      "libs/ledger-live-common/package.json",
      "apps/ledger-live-desktop/static/i18n/en/app.json",
    ]) {
      assert.equal(classify(path), null, path);
    }
  });
});

describe("computeLegacyScore", () => {
  it("scores a PR shipping into live-common and app feature folders at 0%", () => {
    const report = computeLegacyScore(legacyHeavyPr);
    assert.equal(report.newLines, 0);
    assert.equal(report.legacyGrowth, 1188);
    assert.equal(report.score, 0);
    assert.equal(report.legacyRemoved, 0);
    assert.equal(report.areas[0].label, "libs/ledger-live-common");
  });

  it("weighs new additions against the net growth of legacy areas", () => {
    const report = computeLegacyScore([
      { filename: "features/flow/a/src/a.ts", additions: 90, deletions: 0 },
      { filename: "libs/live-wallet/src/a.ts", additions: 30, deletions: 20 },
    ]);
    assert.equal(report.legacyGrowth, 10);
    assert.equal(report.score, 0.9);
    assert.equal(scoreEmoji(report.score), "🟢");
    assert.match(formatReport(report), /Architecture score: 90%/);
  });

  it("does not penalize a cleanup that touches legacy code while shrinking it", () => {
    const report = computeLegacyScore([
      { filename: "libs/A/src/a.ts", additions: 60, deletions: 5 },
      { filename: "libs/B/src/b.ts", additions: 0, deletions: 1000 },
    ]);
    assert.equal(report.legacyGrowth, 0);
    assert.equal(report.score, 1);
    assert.equal(report.legacyRemoved, 945);
  });

  it("credits a move from legacy to the new layers with the whole file", () => {
    const files = [
      {
        filename: "features/platform/a/src/a.ts",
        previous_filename: "libs/ledger-live-common/src/a.ts",
        additions: 10,
        deletions: 5,
      },
      { filename: "libs/live-wallet/src/b.ts", additions: 100, deletions: 0 },
    ];
    const report = computeLegacyScore(files, () => 1000);
    assert.equal(report.newLines, 1000);
    assert.equal(report.legacyGrowth, 0);
    assert.equal(report.legacyRemoved, 895);
    assert.equal(report.score, 1);
  });

  it("keeps a move inside one area as a plain diff", () => {
    const files = [
      {
        filename: "libs/ledger-live-common/src/b.ts",
        previous_filename: "libs/ledger-live-common/src/a.ts",
        additions: 3,
        deletions: 1,
      },
    ];
    const report = computeLegacyScore(files, () => 1000);
    assert.equal(report.legacyGrowth, 2);
  });

  it("keeps a move between two new-layer packages as a plain diff", () => {
    const files = [
      {
        filename: "shared/b/src/a.ts",
        previous_filename: "shared/a/src/a.ts",
        additions: 0,
        deletions: 0,
      },
      { filename: "libs/live-wallet/src/b.ts", additions: 100, deletions: 0 },
    ];
    const report = computeLegacyScore(files, () => 1000);
    assert.equal(report.newLines, 0);
    assert.equal(report.score, 0);
  });

  it("falls back to the diff when the moved file cannot be read", () => {
    const files = [
      {
        filename: "features/platform/a/src/a.ts",
        previous_filename: "libs/ledger-live-common/src/a.ts",
        additions: 10,
        deletions: 5,
      },
    ];
    assert.equal(computeLegacyScore(files, () => undefined).newLines, 10);
  });

  it("thanks only net removals from legacy areas", () => {
    const rewrite = [{ filename: "libs/live-wallet/src/a.ts", additions: 1200, deletions: 1100 }];
    assert.equal(computeLegacyScore(rewrite).legacyRemoved, 0);
  });

  it("floors the displayed score so a failing PR never shows the threshold", () => {
    const report = computeLegacyScore([
      { filename: "features/flow/a/src/a.ts", additions: 196, deletions: 0 },
      { filename: "libs/live-wallet/src/a.ts", additions: 804, deletions: 0 },
    ]);
    assert.equal(scoreEmoji(report.score), "🔴");
    assert.match(formatReport(report), /Architecture score: 19%/);
  });

  it("treats a PR without counted code as fully new", () => {
    assert.equal(
      computeLegacyScore([{ filename: "README.md", additions: 10, deletions: 0 }]).score,
      1,
    );
  });
});

describe("scoreEmoji", () => {
  it("uses the 20% and 80% thresholds", () => {
    assert.equal(scoreEmoji(0.19), "🔴");
    assert.equal(scoreEmoji(0.2), "🟡");
    assert.equal(scoreEmoji(0.8), "🟡");
    assert.equal(scoreEmoji(0.81), "🟢");
  });
});
