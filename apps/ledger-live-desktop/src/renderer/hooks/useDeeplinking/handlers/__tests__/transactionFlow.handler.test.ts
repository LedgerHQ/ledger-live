import { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { closeAllModal, openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { sendHandler, receiveHandler, delegateHandler } from "../transactionFlow.handler";
import { DeeplinkHandlerContext } from "../../types";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  findCryptoCurrencyByKeyword: jest.fn(),
  parseCurrencyUnit: jest.fn((unit, amount) => amount),
}));

jest.mock("@ledgerhq/cryptoassets/state", () => ({
  getCryptoAssetsStore: () => ({
    findTokenById: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn(() => ({ type: "OPEN_MODAL" })),
  closeAllModal: jest.fn(() => ({ type: "CLOSE_ALL_MODAL" })),
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

jest.mock("../../utils", () => ({
  getAccountsOrSubAccountsByCurrency: jest.fn(),
}));

import { getAccountsOrSubAccountsByCurrency } from "../../utils";

const mockFindCryptoCurrencyByKeyword = jest.mocked(findCryptoCurrencyByKeyword);
const mockGetAccountsOrSubAccountsByCurrency = jest.mocked(getAccountsOrSubAccountsByCurrency);
const mockOpenModal = jest.mocked(openModal);
const mockCloseAllModal = jest.mocked(closeAllModal);
const mockSetDrawer = jest.mocked(setDrawer);

const createMockContext = (
  overrides: Partial<DeeplinkHandlerContext> = {},
): DeeplinkHandlerContext => ({
  dispatch: jest.fn(),
  accounts: [],
  navigate: jest.fn(),
  openAddAccountFlow: jest.fn(),
  openAssetFlow: jest.fn(),
  openSendFlow: jest.fn(),
  postOnboardingDeeplinkHandler: jest.fn(),
  tryRedirectToPostOnboardingOrRecover: jest.fn(() => false),
  currentPathname: "/",
  ...overrides,
});

const createMockAccount = (currencyId: string): Account => {
  const currency = getCryptoCurrencyById(currencyId);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    id: `${currencyId}-account-1`,
    type: "Account" as const,
    name: `${currency.name} 1`,
    currency,
    freshAddress: "address123",
  } as unknown as Account;
};

describe("transactionFlow.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendHandler", () => {
    it("opens send flow without account when no currency specified", async () => {
      const context = createMockContext();

      await sendHandler({ type: "send" }, context);

      expect(mockCloseAllModal).toHaveBeenCalled();
      expect(mockSetDrawer).toHaveBeenCalled();
      expect(context.openSendFlow).toHaveBeenCalledWith({
        recipient: undefined,
        amount: undefined,
      });
    });

    it("passes recipient and amount when provided", async () => {
      const context = createMockContext();

      await sendHandler(
        {
          type: "send",
          recipient: "0x123",
          amount: "1.5",
        },
        context,
      );

      expect(context.openSendFlow).toHaveBeenCalledWith({
        recipient: "0x123",
        amount: "1.5",
      });
    });

    it("opens asset flow when currency is not found", async () => {
      mockFindCryptoCurrencyByKeyword.mockReturnValue(undefined);
      const context = createMockContext();

      await sendHandler({ type: "send", currency: "unknown" }, context);

      expect(context.openAssetFlow).toHaveBeenCalled();
    });

    it("opens add account flow when no matching accounts", async () => {
      const mockCurrency = getCryptoCurrencyById("ethereum");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([]);
      const context = createMockContext();

      await sendHandler({ type: "send", currency: "ethereum" }, context);

      expect(context.openAddAccountFlow).toHaveBeenCalledWith(
        mockCurrency,
        true,
        expect.any(Function),
      );
    });

    it("opens send flow with pre-selected account", async () => {
      const mockCurrency = getCryptoCurrencyById("ethereum");
      const mockAccount = createMockAccount("ethereum");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);
      const context = createMockContext({ accounts: [mockAccount] });

      await sendHandler(
        {
          type: "send",
          currency: "ethereum",
          recipient: "0x456",
          amount: "2.0",
        },
        context,
      );

      expect(context.openSendFlow).toHaveBeenCalledWith({
        account: mockAccount,
        parentAccount: undefined,
        recipient: "0x456",
        amount: "2.0",
      });
    });
  });

  describe("receiveHandler", () => {
    it("opens receive modal without account when no currency specified", async () => {
      const context = createMockContext();

      await receiveHandler({ type: "receive" }, context);

      expect(mockCloseAllModal).toHaveBeenCalled();
      expect(context.dispatch).toHaveBeenCalledWith(
        mockOpenModal("MODAL_RECEIVE", { shouldUseReceiveOptions: false }),
      );
    });

    it("opens receive modal with pre-selected account", async () => {
      const mockCurrency = getCryptoCurrencyById("bitcoin");
      const mockAccount = createMockAccount("bitcoin");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);
      const context = createMockContext({ accounts: [mockAccount] });

      await receiveHandler({ type: "receive", currency: "bitcoin" }, context);

      expect(context.dispatch).toHaveBeenCalledWith(
        mockOpenModal("MODAL_RECEIVE", {
          shouldUseReceiveOptions: false,
          recipient: undefined,
          account: mockAccount,
          parentAccount: undefined,
          amount: undefined,
        }),
      );
    });
  });

  describe("delegateHandler", () => {
    it("does nothing when currency is not tezos", async () => {
      const context = createMockContext();

      await delegateHandler({ type: "delegate", currency: "ethereum" }, context);

      expect(mockCloseAllModal).not.toHaveBeenCalled();
      expect(context.dispatch).not.toHaveBeenCalled();
    });

    it("does nothing when no currency is provided", async () => {
      const context = createMockContext();

      await delegateHandler({ type: "delegate" }, context);

      expect(mockCloseAllModal).not.toHaveBeenCalled();
      expect(context.dispatch).not.toHaveBeenCalled();
    });

    it("opens delegate modal for tezos currency", async () => {
      const mockCurrency = getCryptoCurrencyById("tezos");
      const mockAccount = createMockAccount("tezos");
      mockFindCryptoCurrencyByKeyword.mockReturnValue(mockCurrency);
      mockGetAccountsOrSubAccountsByCurrency.mockReturnValue([mockAccount]);
      const context = createMockContext({ accounts: [mockAccount] });

      await delegateHandler({ type: "delegate", currency: "tezos" }, context);

      expect(mockCloseAllModal).toHaveBeenCalled();
      expect(context.dispatch).toHaveBeenCalledWith(
        mockOpenModal("MODAL_DELEGATE", {
          recipient: undefined,
          account: mockAccount,
          parentAccount: undefined,
          amount: undefined,
        }),
      );
    });
  });
});
