import { act, renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { saveSettings } from "~/renderer/actions/settings";
import { useAccountDetailSettingsAdapter } from "./useAccountDetailSettingsAdapter";

const account = genAccount("account-detail-removal-adapter", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 0,
});

describe("useAccountDetailSettingsAdapter", () => {
  it("keeps the account until unmount when the settings adapter is recreated", () => {
    const { result, store, unmount } = renderHook(() => useAccountDetailSettingsAdapter(), {
      initialState: { accounts: [account] },
    });

    act(() => {
      result.current.removeAccount(account);
    });
    act(() => {
      store.dispatch(saveSettings({ locale: "fr" }));
    });

    expect(store.getState().accounts.map(item => item.id)).toContain(account.id);

    unmount();

    expect(store.getState().accounts.map(item => item.id)).not.toContain(account.id);
  });
});
