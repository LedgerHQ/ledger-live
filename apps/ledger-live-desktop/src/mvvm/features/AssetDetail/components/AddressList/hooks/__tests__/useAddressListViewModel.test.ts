import { renderHook, act, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { getAccountsSidebarPath } from "LLD/components/SideBar/utils";
import { useAddressListViewModel } from "../useAddressListViewModel";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

/** Stubs the add-account flow so this suite does not load the full drawer/modal dependency graph. */
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({
    openAddAccountFlow: jest.fn(),
    openAssetFlow: jest.fn(),
  }),
}));

describe("useAddressListViewModel", () => {
  const btc = getCryptoCurrencyById("bitcoin");

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("exposes address section labels", () => {
    const { result } = renderHook(() =>
      useAddressListViewModel(buildDistributionItem({ currency: btc, accounts: [] })),
    );

    expect(result.current.sectionTitle).toBe("Addresses");
    expect(result.current.sectionActionLabel).toBe("Add");
  });

  it("navigates to the token account URL when a parent account is provided", () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    const { result } = renderHook(
      () =>
        useAddressListViewModel(
          buildDistributionItem({ currency: btc, accounts: [tokenAccount, ETH_ACCOUNT] }),
        ),
      { initialState: { accounts: [ETH_ACCOUNT] } },
    );

    act(() => {
      result.current.onAccountClick(tokenAccount, ETH_ACCOUNT);
    });

    expect(mockNavigate).toHaveBeenCalledWith(getAccountUrl(tokenAccount.id, ETH_ACCOUNT.id));
  });

  it.each([false, true] as const)(
    "navigates to the accounts sidebar when a token has no parent (asset section %s)",
    shouldDisplayAssetSection => {
      const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

      const { result } = renderHook(
        () =>
          useAddressListViewModel(
            buildDistributionItem({ currency: btc, accounts: [tokenAccount] }),
          ),
        {
          initialState: withFlagOverrides({
            lwdWallet40: { enabled: true, params: { assetSection: shouldDisplayAssetSection } },
          }),
        },
      );

      act(() => {
        result.current.onAccountClick(tokenAccount, null);
      });

      expect(mockNavigate).toHaveBeenCalledWith(getAccountsSidebarPath(shouldDisplayAssetSection));
    },
  );
});
