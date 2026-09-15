import BigNumber from "bignumber.js";
import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, withFlagOverrides } from "tests/testSetup";
import {
  createMinimalBtcTransaction,
  navigateToAmountScreen,
  resetSendFlowTestState,
  screen,
  setMockBalanceTypeConfig,
  setMockLLDCoinFamily,
  setMockTransaction,
} from "LLD/features/Send/__mocks__/sendFlowTestUtils";
import { SendWorkflow } from "LLD/features/Send";
import { ZcashSyncNotice } from "../ZcashSyncNotice";

jest.mock("~/renderer/families/bitcoin/ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));

describe("Zcash shielded send flow", () => {
  const zcashCurrency = getCryptoCurrencyById("zcash");

  const zcashPrivateInfo = {
    ufvk: "uview1testufvk",
    shieldedAddress:
      "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9",
    syncState: "disabled",
    progress: 0,
  };

  const createZcashAccount = (privateInfoOverrides: Partial<typeof zcashPrivateInfo> = {}) => {
    const base = genAccount("zcash-shielded-send-test");
    return {
      ...base,
      id: "mock-zcash-account-id",
      currency: zcashCurrency,
      freshAddress: "t1ZcashTransparentXXXXXXXXXXXXXXXXXXXXXX",
      balance: new BigNumber("10000000"),
      spendableBalance: new BigNumber("10000000"),
      privateInfo: {
        ...zcashPrivateInfo,
        ...privateInfoOverrides,
      },
    };
  };

  const zcashBalanceTypeConfig = {
    getOptions: jest.fn(() => [
      {
        id: "public",
        translationKey: "balanceType.transparent",
        balance: new BigNumber(1000),
        hasPendingBalance: false,
        icon: "check" as const,
      },
      {
        id: "private",
        translationKey: "balanceType.shielded",
        balance: new BigNumber(2000),
        hasPendingBalance: false,
        icon: "lock" as const,
      },
    ]),
    getSelectedOptionId: jest.fn((transaction: unknown) => {
      if (typeof transaction !== "object" || transaction === null || !("sender" in transaction)) {
        return null;
      }
      const sender = (transaction as { sender?: string }).sender;
      return typeof sender === "string" ? sender : null;
    }),
    buildSelectionPatch: jest.fn((id: string) => ({ sender: id })),
    getSelfTransferTarget: jest.fn(() => null),
    buildSelfTransferPatch: jest.fn(() => ({})),
    getSelectableBalance: jest.fn(({ optionId }: { optionId: string }) =>
      optionId === "private" ? new BigNumber(2000) : new BigNumber(1000),
    ),
  };

  const renderZcashSendFlow = (
    account: ReturnType<typeof createZcashAccount>,
    shieldedEnabled = true,
  ) =>
    render(<SendWorkflow isOpen onClose={jest.fn()} params={{ account: account as never }} />, {
      initialState: {
        accounts: [account],
        settings: {
          counterValue: "USD",
          counterValueExchange: "BINANCE",
          currenciesSettings: {},
        },
        ...withFlagOverrides({ zcashShielded: { enabled: shieldedEnabled } }),
      },
    });

  beforeEach(() => {
    resetSendFlowTestState("bitcoin");
    setMockBalanceTypeConfig(zcashBalanceTypeConfig);
    setMockLLDCoinFamily({ SendRecipientNotice: ZcashSyncNotice });
  });

  it("shows sync banner on recipient screen when private sender and syncState=running", async () => {
    const account = createZcashAccount({ syncState: "running", progress: 50 });
    const { user } = renderZcashSendFlow(account);

    await screen.findByTestId("balance-type-screen");
    await user.click(screen.getByTestId("balance-type-private"));

    expect(await screen.findByTestId("zcash-sync-banner-running")).toBeVisible();
  });

  it("hides sync banner when the zcashShielded flag is off, even with private sender and a running sync", async () => {
    const account = createZcashAccount({ syncState: "running", progress: 50 });
    const { user } = renderZcashSendFlow(account, false);

    await screen.findByTestId("balance-type-screen");
    await user.click(screen.getByTestId("balance-type-private"));

    expect(await screen.findByTestId("send-recipient-input")).toBeVisible();
    expect(screen.queryByTestId("zcash-sync-banner-running")).not.toBeInTheDocument();
  });

  it("hides sync banner when sender is public (transparent pool)", async () => {
    const account = createZcashAccount({ syncState: "running", progress: 50 });
    const { user } = renderZcashSendFlow(account);

    await screen.findByTestId("balance-type-screen");
    await user.click(screen.getByTestId("balance-type-public"));

    expect(await screen.findByTestId("send-recipient-input")).toBeVisible();
    expect(screen.queryByTestId("zcash-sync-banner-running")).not.toBeInTheDocument();
  });

  it("shows the amount screen after entering a transparent recipient", async () => {
    const account = createZcashAccount({ syncState: "complete" });
    setMockTransaction(
      createMinimalBtcTransaction({ recipient: "t1ZcashTransparentXXXXXXXXXXXXXXXXXXXXXX" }),
    );
    const { user } = renderZcashSendFlow(account);

    await screen.findByTestId("balance-type-screen");
    await user.click(screen.getByTestId("balance-type-public"));

    await navigateToAmountScreen(user, "t1ZcashTransparentXXXXXXXXXXXXXXXXXXXXXX");

    expect(screen.getByTestId("send-amount-step")).toBeVisible();
    expect(screen.getByTestId("send-network-fees-row")).toBeVisible();
  });

  it.each([
    { syncState: "running" as const, bannerTestId: "zcash-sync-banner-running", progress: 50 },
    { syncState: "ready" as const, bannerTestId: "zcash-sync-banner-stopped", progress: 0 },
  ])(
    "blocks advancing to amount while a private send sync is $syncState",
    async ({ syncState, bannerTestId, progress }) => {
      const shieldedRecipient =
        "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
      const account = createZcashAccount({ syncState, progress });
      setMockTransaction(createMinimalBtcTransaction({ recipient: shieldedRecipient }));
      const { user } = renderZcashSendFlow(account);

      await screen.findByTestId("balance-type-screen");
      await user.click(screen.getByTestId("balance-type-private"));

      expect(await screen.findByTestId(bannerTestId)).toBeVisible();

      const recipientInput = await screen.findByTestId("send-recipient-input");
      await user.type(recipientInput, shieldedRecipient);

      const matchedButton = await screen.findByTestId("send-matched-address-button");
      await user.click(matchedButton);

      expect(screen.queryByTestId("send-amount-step")).not.toBeInTheDocument();
      expect(screen.getByTestId(bannerTestId)).toBeVisible();
    },
    20000,
  );

  it("advances to amount for a private send once the shielded sync is complete", async () => {
    const shieldedRecipient =
      "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
    const account = createZcashAccount({ syncState: "complete" });
    setMockTransaction(createMinimalBtcTransaction({ recipient: shieldedRecipient }));
    const { user } = renderZcashSendFlow(account);

    await screen.findByTestId("balance-type-screen");
    await user.click(screen.getByTestId("balance-type-private"));

    await navigateToAmountScreen(user, shieldedRecipient);

    expect(screen.getByTestId("send-amount-step")).toBeVisible();
  }, 20000);
});
