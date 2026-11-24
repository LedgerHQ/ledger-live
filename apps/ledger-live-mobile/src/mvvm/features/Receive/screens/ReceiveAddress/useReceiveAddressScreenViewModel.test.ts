import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { renderHook } from "@tests/test-renderer";
import { openShareSheet } from "@shared/share-sheet";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";
import { VerifyAddressExecutorLWM } from "../../verifyAddressIntent/VerifyAddressExecutorLWM";
import { useReceiveAddressScreenViewModel } from "./useReceiveAddressScreenViewModel";

jest.mock("@shared/share-sheet", () => ({ openShareSheet: jest.fn(async () => undefined) }));
jest.mock("LLM/features/AppLock/adapters/appVisibility", () => ({
  leaveAppFor: jest.fn((task: () => Promise<unknown>) => task()),
}));

const tronEntry = LegacyAccountEntrySchema.parse(
  mockAccountEntry({
    descriptor: mockAddressAccountDescriptor({ network: "tron", path: "m/44h/195h/0h/0/0" }),
  }),
);
const tronAccount: Account = {
  ...genAccount("tron", { currency: getCryptoCurrencyById("tron") }),
  id: tronEntry.legacyId,
};

const renderViewModel = (entry = tronEntry) =>
  renderHook(
    () =>
      useReceiveAddressScreenViewModel({
        accountUUID: entry.accountUUID,
        assetId: CryptoOrTokenCurrencyIdSchema.parse("tron"),
        onClose: jest.fn(),
      }),
    {
      overrideInitialState: state => ({
        ...state,
        accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
        accounts: { ...state.accounts, active: [tronAccount] },
      }),
    },
  );

describe("useReceiveAddressScreenViewModel", () => {
  it("gives the screen the mobile verification, clipboard and share sheet", () => {
    const { result } = renderViewModel();

    expect(result.current).toEqual(
      expect.objectContaining({
        VerifyAddressExecutor: VerifyAddressExecutorLWM,
        onCopyAddress: expect.any(Function),
        onShareAddress: expect.any(Function),
      }),
    );
  });

  it("shares the address with the image of its card", () => {
    const { result } = renderViewModel();

    result.current.onShareAddress?.("TXYZ", "file://card.png");

    expect(openShareSheet).toHaveBeenCalledWith({ message: "TXYZ", imageUrl: "file://card.png" });
  });

  it("lets the app lock see a share sheet that cannot open, then keeps the screen", async () => {
    jest.mocked(openShareSheet).mockRejectedValueOnce(new Error("no activity"));
    const { result } = renderViewModel();

    await expect(result.current.onShareAddress?.("TXYZ")).resolves.toBeUndefined();
    await expect(jest.mocked(leaveAppFor).mock.results.at(-1)?.value).rejects.toThrow(
      "no activity",
    );
  });

  it("reads the account's family config", () => {
    const { result } = renderViewModel();

    expect(
      result.current.getFamilyConfig?.({
        descriptor: tronEntry.descriptor,
        asset: { id: CryptoOrTokenCurrencyIdSchema.parse("tron"), type: "CryptoCurrency" },
        accountStatus: mockAccountStatus({ used: false }),
      }),
    ).toEqual({ notices: ["tronInactiveAccount"] });
  });
});
