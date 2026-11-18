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
import { act, renderHook, waitFor } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { VerifyAddressExecutorLWD } from "../../verifyAddressIntent/VerifyAddressExecutorLWD";
import { useSanctionSimulation } from "../../hooks/useSanctionSimulation";
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
  it("gives the screen the desktop verification and clipboard", () => {
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

  it("reads the family config with the legacy account the family still needs", () => {
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

  it("treats every address as sanctioned while DevTools simulates it", async () => {
    jest.mocked(useLLDCoinFamily).mockReturnValue({});
    const { result } = renderViewModel();
    const tool = renderHook(() => useSanctionSimulation());

    act(() => tool.result.current.setSimulated(true));
    await expect(result.current.checkAddressSanctioned?.("0xabc")).resolves.toBe(true);
    act(() => tool.result.current.setSimulated(false));
  });

  it("should open the legacy receive modal on the account when it hands over", async () => {
    jest.mocked(useLLDCoinFamily).mockReturnValue({});
    const { result, store } = renderViewModel();

    act(() => result.current.onUseLegacyFlow?.());

    await waitFor(() =>
      expect(store.getState().modals.MODAL_RECEIVE).toEqual(
        expect.objectContaining({ isOpened: true, data: { account: ethAccount } }),
      ),
    );
  });
});
