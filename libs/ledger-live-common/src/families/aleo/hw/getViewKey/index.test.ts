import type Transport from "@ledgerhq/hw-transport";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { createAction, getViewKeyExec, Request, State, type ViewKeyProgress } from "./index";
import { viewKeyResolver } from "../../setup";

const mockViewKeyResolver = jest.mocked(viewKeyResolver);

jest.mock("../../setup", () => ({
  viewKeyResolver: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("getViewKey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getViewKeyExec", () => {
    const mockTransport = {} as Transport;
    const mockCurrency = { id: "aleo" } as CryptoCurrency;
    const mockAccount1 = {
      id: "account1",
      freshAddressPath: "44'/1234'/0'/0/0",
    } as Account;
    const mockAccount2 = {
      id: "account2",
      freshAddressPath: "44'/1234'/1'/0/0",
    } as Account;

    it("retrieves view key for single account", done => {
      const viewKey = "viewkey123";
      mockViewKeyResolver.mockResolvedValue({ viewKey });

      const request: Request = {
        currency: mockCurrency,
        selectedAccounts: [mockAccount1],
      };

      getViewKeyExec(mockTransport, request).subscribe({
        next: progress => {
          expect(progress).toEqual({
            viewKeys: { account1: viewKey },
            completed: 1,
            total: 1,
          });
        },
        complete: () => {
          expect(mockViewKeyResolver).toHaveBeenCalledWith(mockTransport, {
            path: mockAccount1.freshAddressPath,
            currency: mockCurrency,
          });
          done();
        },
        error: done,
      });
    });

    it("retrieves view keys for multiple accounts with progress tracking", done => {
      mockViewKeyResolver
        .mockResolvedValueOnce({ viewKey: "key1" })
        .mockResolvedValueOnce({ viewKey: "key2" });

      const request: Request = {
        currency: mockCurrency,
        selectedAccounts: [mockAccount1, mockAccount2],
      };

      const progressUpdates: ViewKeyProgress[] = [];

      getViewKeyExec(mockTransport, request).subscribe({
        next: progress => progressUpdates.push(progress),
        complete: () => {
          expect(progressUpdates).toEqual([
            { viewKeys: { account1: "key1" }, completed: 1, total: 2 },
            { viewKeys: { account1: "key1", account2: "key2" }, completed: 2, total: 2 },
          ]);
          expect(mockViewKeyResolver).toHaveBeenCalledTimes(2);
          done();
        },
        error: done,
      });
    });

    it("propagates error when viewKeyResolver fails", done => {
      const error = new Error("Hardware wallet error");
      mockViewKeyResolver.mockRejectedValue(error);

      const request: Request = {
        currency: mockCurrency,
        selectedAccounts: [mockAccount1],
      };

      getViewKeyExec(mockTransport, request).subscribe({
        error: (err: Error) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it("stops processing on first error", done => {
      mockViewKeyResolver
        .mockResolvedValueOnce({ viewKey: "key1" })
        .mockRejectedValueOnce(new Error("Failed"));

      const request: Request = {
        currency: mockCurrency,
        selectedAccounts: [mockAccount1, mockAccount2],
      };

      let emissionCount = 0;

      getViewKeyExec(mockTransport, request).subscribe({
        next: () => emissionCount++,
        error: () => {
          expect(emissionCount).toBe(1);
          done();
        },
      });
    });

    it("throws when currency is missing", () => {
      const request: Request = {
        selectedAccounts: [mockAccount1],
      };

      expect(() => {
        getViewKeyExec(mockTransport, request);
      }).toThrow("currency is required");
    });

    it("throws when selectedAccounts is empty", () => {
      const request: Request = {
        currency: mockCurrency,
        selectedAccounts: [],
      };

      expect(() => {
        getViewKeyExec(mockTransport, request);
      }).toThrow("selectedAccounts cannot be empty");
    });
  });

  describe("createAction", () => {
    const mockConnectAppExec = jest.fn();
    const mockGetViewKey = jest.fn();

    it("should return useHook and mapResult functions", () => {
      const action = createAction(mockConnectAppExec, mockGetViewKey);

      expect(action).toEqual({
        useHook: expect.any(Function),
        mapResult: expect.any(Function),
      });
    });

    it("should map state.result correctly", () => {
      const action = createAction(mockConnectAppExec, mockGetViewKey);
      const mockState = {
        result: { acc1: "viewkey1", acc2: "viewkey2" },
        error: null,
        sharePending: false,
        shareProgress: { completed: 2, total: 2, viewKeys: {} },
      } as unknown as State;

      expect(action.mapResult(mockState)).toEqual(mockState.result);
    });
  });
});
