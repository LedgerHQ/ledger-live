import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { renderHook } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";
import { useReceiveAddressDialogViewModel } from "./useReceiveAddressDialogViewModel";

jest.mock("~/renderer/families", () => ({ useLLDCoinFamily: jest.fn() }));

const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const ethAccount: Account = {
  ...genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }),
  id: entry.legacyId,
};
const target = {
  accountUUID: entry.accountUUID,
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
};

const renderViewModel = () =>
  renderHook(() => useReceiveAddressDialogViewModel(target), {
    initialState: {
      accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
      accounts: [ethAccount],
    },
  });

describe("useReceiveAddressDialogViewModel", () => {
  it("should give the screen the desktop verification and clipboard", () => {
    jest.mocked(useLLDCoinFamily).mockReturnValue({});
    const { result } = renderViewModel();

    expect(result.current).toEqual(
      expect.objectContaining({
        ...target,
        VerifyAddressExecutor: VerifyAddressExecutorLWD,
        onCopyAddress: expect.any(Function),
        getFamilyConfig: undefined,
      }),
    );
    expect(result.current.onShareAddress).toBeUndefined();
  });

  it("should read the family config with the legacy account the family still needs", () => {
    const receiveAddressConfig = jest.fn(() => ({ notices: ["utxo" as const] }));
    jest.mocked(useLLDCoinFamily).mockReturnValue({ receiveAddressConfig });
    const { result } = renderViewModel();
    const { descriptor, asset } = mockReceiveFamilyConfigInput();

    expect(result.current.getFamilyConfig?.({ descriptor, asset })).toEqual({ notices: ["utxo"] });
    expect(useLLDCoinFamily).toHaveBeenCalledWith("evm");
    expect(receiveAddressConfig).toHaveBeenCalledWith(
      expect.objectContaining({ descriptor, asset, legacyAccount: ethAccount }),
    );
  });
});
