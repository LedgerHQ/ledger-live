import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { act, renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { usePayTabRequestReceive } from "../usePayTabRequestReceive";

const mockNavigate = jest.fn();
const mockOpenDrawer = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

jest.mock("~/rootnavigation", () => ({
  navigationRef: { current: { getCurrentRoute: () => ({ name: "PayTab" }) } },
}));

const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const ethAccount: Account = {
  ...genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }),
  id: entry.legacyId,
};

type OnAccountSelected = (account: Account, parentAccount?: Account) => void;

describe("usePayTabRequestReceive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the receive address screen with the screen the user requested from", () => {
    const { result } = renderHook(() => usePayTabRequestReceive(), {
      overrideInitialState: state => ({
        ...state,
        accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
      }),
    });
    act(() => result.current.open());
    const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0] as {
      onAccountSelected: OnAccountSelected;
    };

    onAccountSelected(ethAccount);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Receive, {
      screen: ScreenName.ReceiveAddress,
      params: { accountUUID: entry.accountUUID, assetId: "ethereum", source: "PayTab" },
    });
  });
});
