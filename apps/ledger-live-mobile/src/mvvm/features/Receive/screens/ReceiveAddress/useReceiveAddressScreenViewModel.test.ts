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
import { captureRef } from "react-native-view-shot";
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

  it("shares the card as an image and the address as text", async () => {
    const { result } = renderViewModel();

    result.current.onShareAddress?.("TXYZ");

    await waitFor(() =>
      expect(Share.open).toHaveBeenCalledWith({
        url: "file://mock.png",
        message: "TXYZ",
        failOnCancel: false,
      }),
    );
    expect(captureRef).toHaveBeenCalledWith(result.current.cardRef, { format: "png" });
  });

  it("shares the address alone when the card cannot be captured", async () => {
    jest.mocked(captureRef).mockRejectedValueOnce(new Error("capture failed"));
    const { result } = renderViewModel();

    result.current.onShareAddress?.("TXYZ");

    await waitFor(() =>
      expect(Share.open).toHaveBeenCalledWith({
        url: undefined,
        message: "TXYZ",
        failOnCancel: false,
      }),
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
