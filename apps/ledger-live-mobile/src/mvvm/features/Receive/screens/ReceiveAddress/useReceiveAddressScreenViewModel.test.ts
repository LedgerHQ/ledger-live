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
import { renderHook, waitFor } from "@tests/test-renderer";
import Share from "react-native-share";
import { VerifyAddressExecutorLWM } from "../../verifyAddressIntent/VerifyAddressExecutorLWM";
import { useReceiveAddressScreenViewModel } from "./useReceiveAddressScreenViewModel";

jest.mock("LLM/features/AppLock/adapters/appVisibility", () => ({
  leaveAppFor: (task: () => Promise<unknown>) => task(),
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

const openLegacyReceive = jest.fn();

const renderViewModel = (entry = tronEntry) =>
  renderHook(
    () =>
      useReceiveAddressScreenViewModel({
        accountUUID: entry.accountUUID,
        assetId: CryptoOrTokenCurrencyIdSchema.parse("tron"),
        onClose: jest.fn(),
        openLegacyReceive,
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
  it("should give the screen the mobile verification, clipboard and share sheet", () => {
    const { result } = renderViewModel();

    expect(result.current).toEqual(
      expect.objectContaining({
        VerifyAddressExecutor: VerifyAddressExecutorLWM,
        onCopyAddress: expect.any(Function),
        onShareAddress: expect.any(Function),
      }),
    );
  });

  it("should share the address through the system share sheet", () => {
    const { result } = renderViewModel();

    result.current.onShareAddress?.("TXYZ");

    expect(Share.open).toHaveBeenCalledWith({ message: "TXYZ", failOnCancel: false });
  });

  it("should read the account's family config", () => {
    const { result } = renderViewModel();

    expect(
      result.current.getFamilyConfig?.({
        descriptor: tronEntry.descriptor,
        asset: { id: CryptoOrTokenCurrencyIdSchema.parse("tron"), type: "CryptoCurrency" },
        accountStatus: mockAccountStatus({ used: false }),
      }),
    ).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should open the legacy receive screen on the account when it hands over", async () => {
    const { result } = renderViewModel();

    result.current.onUseLegacyFlow?.();

    await waitFor(() =>
      expect(openLegacyReceive).toHaveBeenCalledWith({ accountId: tronAccount.id }),
    );
  });
});
