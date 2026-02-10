/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { renderHook, waitFor } from "tests/testSetup";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { openModal, closeAllModal } from "~/renderer/actions/modals";
import { useDeepLinkHandler } from "../useDeepLinkHandler";
import BigNumber from "bignumber.js";

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
  closeAllModal: jest.fn(() => ({ type: "CLOSE_ALL_MODAL" })),
}));

jest.mock("~/renderer/actions/walletSync");

const mockOpenModal = jest.mocked(openModal);
const mockCloseAllModal = jest.mocked(closeAllModal);

jest.mock("~/renderer/analytics/TrackPage", () => ({
  setTrackingSource: jest.fn(),
}));

jest.mock(
  "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback",
  () => ({
    useNavigateToPostOnboardingHubCallback: () => jest.fn(),
  }),
);

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingDeeplinkHandler: () => jest.fn(),
}));

jest.mock("../../useAutoRedirectToPostOnboarding", () => ({
  useRedirectToPostOnboardingCallback: () => jest.fn(() => false),
}));

const mockOpenAddAccountFlow = jest.fn();
const mockOpenAssetFlow = jest.fn();

jest.mock("LLD/features/ModularDrawer/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({
    openAddAccountFlow: mockOpenAddAccountFlow,
    openAssetFlow: mockOpenAssetFlow,
  }),
}));

const mockOpenSendFlow = jest.fn(params => {
  // Maintain backward compatibility: call openModal when no account is provided
  if (!params?.account) {
    mockOpenModal("MODAL_SEND", params || {});
  } else {
    // When account is provided, convert amount from string to BigNumber for compatibility
    const modalParams = {
      ...params,
      amount: typeof params.amount === "string" ? new BigNumber(params.amount) : params.amount,
    };
    mockOpenModal("MODAL_SEND", modalParams);
  }
});

jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => mockOpenSendFlow,
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  findCryptoCurrencyByKeyword: jest.fn(),
  parseCurrencyUnit: jest.fn((unit, amount) => amount),
}));

const mockFindCryptoCurrencyByKeyword = jest.mocked(findCryptoCurrencyByKeyword);

const mockGetCryptoAssetsStore = {
  findTokenById: jest.fn(),
};

jest.mock("@ledgerhq/cryptoassets/state", () => ({
  ...jest.requireActual("@ledgerhq/cryptoassets/state"),
  getCryptoAssetsStore: () => mockGetCryptoAssetsStore,
}));

const mockGetAccountsOrSubAccountsByCurrency = jest.fn(
  (_currency: CryptoOrTokenCurrency, _accounts: Account[]): (Account | TokenAccount)[] => [],
);

jest.mock("../utils", () => ({
  trackDeeplinkingEvent: jest.fn(),
  getAccountsOrSubAccountsByCurrency: jest.fn((currency, accounts) =>
    mockGetAccountsOrSubAccountsByCurrency(currency, accounts),
  ),
}));

const createMockAccount = (currencyId: string): Account => {
  const currency = getCryptoCurrencyById(currencyId);
  const zero = new BigNumber(0);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    id: `${currencyId}-account-1`,
    type: "Account" as const,
    name: `${currency.name} 1`,
    currency,
    balance: zero,
    spendableBalance: zero,
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    lastSyncDate: new Date(),
    swapHistory: [],
  } as unknown as Account;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const createMockTokenAccount = (parentId: string, tokenId: string): TokenAccount =>
  ({
    id: `token-${tokenId}`,
    type: "TokenAccount" as const,
    parentId,
    token: { id: tokenId },
    balance: new BigNumber(0),
    operationsCount: 0,
  }) as unknown as TokenAccount;

describe("useDeepLinkHandler", () => {
  const testDeeplink = async (url: string, accounts: Account[] = []) => {
    const { result } = renderHook(() => useDeepLinkHandler(), {
      initialState: { accounts },
    });
    const { handler } = result.current;
    handler(url, false);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("add-account flow", () => {
    it("opens add account flow with valid currency", async () => {
      const mockCurrency = getCryptoCurrencyById("bitcoin");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);

      await testDeeplink("ledgerwallet://add-account?currency=bitcoin");

      await waitFor(() => {
        expect(mockOpenAddAccountFlow).toHaveBeenCalledWith(mockCurrency, true);
      });
    });

    it("does not open add account flow with unknown currency", async () => {
      mockFindCryptoCurrencyByKeyword.mockReturnValue(null);

      await testDeeplink("ledgerwallet://add-account?currency=unknowncoin");

      await waitFor(() => {
        expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
      });
    });

    it("handles case-insensitive currency parameter", async () => {
      const mockCurrency = getCryptoCurrencyById("ethereum");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);

      await testDeeplink("ledgerwallet://add-account?currency=ETHEREUM");

      await waitFor(() => {
        expect(mockFindCryptoCurrencyByKeyword).toHaveBeenCalledWith("ETHEREUM");
        expect(mockOpenAddAccountFlow).toHaveBeenCalledWith(mockCurrency, true);
      });
    });
  });

  describe("send/receive/delegate flows", () => {
    describe.each([
      ["send", "MODAL_SEND"],
      ["receive", "MODAL_RECEIVE"],
      ["delegate", "MODAL_DELEGATE"],
    ] as const)("%s flow", (flow, modalName) => {
      if (flow !== "delegate") {
        it("opens modal without account pre-selection when no currency specified", async () => {
          await testDeeplink(`ledgerwallet://${flow}`);

          await waitFor(() => {
            expect(mockCloseAllModal).toHaveBeenCalled();
            if (flow === "receive") {
              expect(mockOpenModal).toHaveBeenCalledWith(modalName, {
                shouldUseReceiveOptions: false,
              });
            } else {
              expect(mockOpenModal).toHaveBeenCalledWith(modalName, {});
            }
          });
        });

        it("redirects to asset flow when currency is not found", async () => {
          mockFindCryptoCurrencyByKeyword.mockReturnValue(undefined);
          mockGetCryptoAssetsStore.findTokenById.mockResolvedValue(null);

          await testDeeplink(`ledgerwallet://${flow}?currency=unknowncoin`);

          await waitFor(() => {
            expect(mockCloseAllModal).toHaveBeenCalled();
            expect(mockOpenAssetFlow).toHaveBeenCalled();
          });
        });
      }

      it("redirects to add account flow when currency exists but user has no accounts", async () => {
        const currency = flow === "delegate" ? "tezos" : "ethereum";
        const mockCurrency = getCryptoCurrencyById(currency);
        mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
        mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([]);

        await testDeeplink(`ledgerwallet://${flow}?currency=${currency}`);

        await waitFor(() => {
          expect(mockCloseAllModal).toHaveBeenCalled();
          expect(mockOpenAddAccountFlow).toHaveBeenCalledWith(
            mockCurrency,
            true,
            expect.any(Function),
          );
        });
      });

      it("opens modal with pre-selected account when matching account exists", async () => {
        const currency = flow === "delegate" ? "tezos" : "ethereum";
        const mockCurrency = getCryptoCurrencyById(currency);
        const mockAccount = createMockAccount(currency);

        mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
        mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);

        await testDeeplink(`ledgerwallet://${flow}?currency=${currency}`, [mockAccount]);

        await waitFor(() => {
          expect(mockCloseAllModal).toHaveBeenCalled();
          expect(mockOpenModal).toHaveBeenCalledWith(modalName, {
            ...(flow === "receive" ? { shouldUseReceiveOptions: false } : {}),
            recipient: undefined,
            account: mockAccount,
            parentAccount: undefined,
            amount: undefined,
          });
        });
      });
    });

    describe("send flow", () => {
      it("pre-fills recipient and amount when provided in URL", async () => {
        const mockCurrency = getCryptoCurrencyById("ethereum");
        const mockAccount = createMockAccount("ethereum");

        mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
        mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);

        const recipient = "0x450A5bbcE3ASZ0A738B3F48842BaSA3A9C360d97";
        const amount = "0.0001";
        await testDeeplink(
          `ledgerwallet://send?currency=ethereum&recipient=${recipient}&amount=${amount}`,
          [mockAccount],
        );

        await waitFor(() => {
          expect(mockCloseAllModal).toHaveBeenCalled();
          expect(mockOpenModal).toHaveBeenCalledWith("MODAL_SEND", {
            recipient,
            account: mockAccount,
            parentAccount: undefined,
            amount: new BigNumber(amount),
          });
        });
      });

      it("opens modal with token account and its parent account", async () => {
        const mockParentAccount = createMockAccount("ethereum");
        const mockTokenAccount = createMockTokenAccount(
          mockParentAccount.id,
          "ethereum/erc20/usdt",
        );

        mockFindCryptoCurrencyByKeyword.mockReturnValue(undefined);
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        mockGetCryptoAssetsStore.findTokenById.mockResolvedValue({
          id: "ethereum/erc20/usdt",
          type: "TokenCurrency",
        } as unknown as CryptoOrTokenCurrency);
        mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockTokenAccount]);

        await testDeeplink("ledgerwallet://send?currency=ethereum/erc20/usdt", [mockParentAccount]);

        await waitFor(() => {
          expect(mockCloseAllModal).toHaveBeenCalled();
          expect(mockOpenModal).toHaveBeenCalledWith("MODAL_SEND", {
            recipient: undefined,
            account: mockTokenAccount,
            parentAccount: mockParentAccount,
            amount: undefined,
          });
        });
      });
    });

    describe("delegate flow", () => {
      it("ignores delegation request without currency parameter", async () => {
        await testDeeplink("ledgerwallet://delegate");

        await waitFor(() => {
          expect(mockOpenModal).not.toHaveBeenCalled();
          expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
          expect(mockOpenAssetFlow).not.toHaveBeenCalled();
        });
      });

      it("ignores delegation request for non-Tezos currencies", async () => {
        await testDeeplink("ledgerwallet://delegate?currency=ethereum");

        await waitFor(() => {
          expect(mockOpenModal).not.toHaveBeenCalled();
          expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
          expect(mockOpenAssetFlow).not.toHaveBeenCalled();
        });
      });
    });
  });
});
