import React, { type ComponentType, type ReactNode } from "react";
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
import { ServiceStatusProvider } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { http, HttpResponse, server } from "@tests/server";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { getEnv } from "@shared/env";
import { openShareSheet } from "@shared/share-sheet";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";
import { VerifyAddressExecutorLWM } from "../../verifyAddressIntent/VerifyAddressExecutorLWM";
import { useReceiveAddressScreenViewModel } from "./useReceiveAddressScreenViewModel";

jest.mock("@shared/share-sheet", () => ({ openShareSheet: jest.fn(async () => undefined) }));
jest.mock("LLM/features/AppLock/adapters/appVisibility", () => ({
  leaveAppFor: jest.fn((task: () => Promise<unknown>) => task()),
}));

const mockTronGateAction = jest.fn();
const mockStopListening = jest.fn();
const mockFocusListeners: (() => void)[] = [];
const mockNavigation = {
  navigate: jest.fn(),
  addListener: (_event: string, listener: () => void) => {
    mockFocusListeners.push(listener);
    return mockStopListening;
  },
};
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation,
}));
jest.mock("~/generated/ReceiveGateAction", () => ({
  __esModule: true,
  default: { tron: (...args: unknown[]) => mockTronGateAction(...args) },
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

const USDT_ID = "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t";

const serveUsdt = () =>
  server.use(
    http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, () =>
      HttpResponse.json([
        {
          id: USDT_ID,
          contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          standard: "trc20",
          decimals: 6,
          delisted: false,
          name: "Tether USD",
          ticker: "USDT",
          units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
        },
      ]),
    ),
  );

const renderViewModel = (
  entry = tronEntry,
  innerWrapper?: ComponentType<{ children?: ReactNode }>,
  assetId = "tron",
) =>
  renderHook(
    () =>
      useReceiveAddressScreenViewModel({
        accountUUID: entry.accountUUID,
        assetId: CryptoOrTokenCurrencyIdSchema.parse(assetId),
        onClose: jest.fn(),
      }),
    {
      innerWrapper,
      overrideInitialState: state => ({
        ...state,
        accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
        accounts: { ...state.accounts, active: [tronAccount] },
      }),
    },
  );

beforeEach(() => {
  mockTronGateAction.mockClear();
  mockStopListening.mockClear();
  mockFocusListeners.length = 0;
});

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

  it("shares the address with the image of its card", () => {
    const { result } = renderViewModel();

    result.current.onShareAddress?.("TXYZ", "file://card.png");

    expect(openShareSheet).toHaveBeenCalledWith({ message: "TXYZ", imageUrl: "file://card.png" });
  });

  it("lets the app lock see a share sheet that cannot open, then keeps the screen", async () => {
    jest.mocked(openShareSheet).mockRejectedValueOnce(new Error("no activity"));
    const { result } = renderViewModel();

    await expect(result.current.onShareAddress?.("TXYZ")).resolves.toBeUndefined();
    await expect(jest.mocked(leaveAppFor).mock.results.at(-1)?.value).rejects.toThrow(
      "no activity",
    );
  });

  it("reads the account's family config", () => {
    const { result } = renderViewModel();

    expect(
      result.current.getFamilyConfig?.({
        asset: { id: CryptoOrTokenCurrencyIdSchema.parse("tron"), type: "CryptoCurrency" },
        accountStatus: mockAccountStatus({ used: false }),
      }),
    ).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("gives the Tron incidents and the global ones, with their Ledger links", async () => {
    const incident = (name: string, componentName: string | undefined, body: string) => ({
      name,
      components: componentName ? [{ name: componentName }] : [],
      incident_updates: [{ body }],
    });
    server.use(
      http.get("*/summary.json", () =>
        HttpResponse.json({
          incidents: [
            incident(
              "Tron degraded",
              "Tron (TRX)",
              'See <a href="https://support.ledger.com/x">our article</a> or <a href="https://evil.example">this</a>.',
            ),
            incident("Bitcoin degraded", "Bitcoin (BTC)", "Delays."),
            incident("Ledger Wallet down", undefined, "Investigating."),
          ],
        }),
      ),
    );
    const { result } = renderViewModel(tronEntry, ({ children }) => (
      <ServiceStatusProvider autoUpdateDelay={60_000}>{children}</ServiceStatusProvider>
    ));

    await waitFor(() =>
      expect(result.current.serviceIncidents).toEqual([
        {
          title: "Tron degraded",
          description: [
            { text: "See " },
            { text: "our article", url: "https://support.ledger.com/x" },
            { text: " or " },
            { text: "this" },
            { text: "." },
          ],
        },
        { title: "Ledger Wallet down", description: [{ text: "Investigating." }] },
      ]),
    );
  });

  it("opens the family flow the account needs to receive, then reads the gate again on return", async () => {
    const { result } = renderViewModel();
    const refreshGate = jest.fn();

    result.current.onResolveGate?.(refreshGate);

    await waitFor(() =>
      expect(mockTronGateAction).toHaveBeenCalledWith(
        expect.objectContaining({ account: tronAccount, token: undefined }),
      ),
    );
    expect(refreshGate).not.toHaveBeenCalled();

    mockFocusListeners.forEach(listener => listener());
    expect(refreshGate).toHaveBeenCalledTimes(1);
  });

  it("gives the family flow the token the screen receives", async () => {
    serveUsdt();
    const { result } = renderViewModel(tronEntry, undefined, USDT_ID);

    await waitFor(() => expect(result.current.onResolveGate).toBeDefined());
    act(() => result.current.onResolveGate?.(jest.fn()));

    expect(mockTronGateAction).toHaveBeenCalledWith(
      expect.objectContaining({
        account: tronAccount,
        token: expect.objectContaining({ id: USDT_ID, ticker: "USDT" }),
      }),
    );
  });

  it("opens the family flow once when pressed again before the user is back", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.onResolveGate?.(jest.fn());
      result.current.onResolveGate?.(jest.fn());
    });

    expect(mockTronGateAction).toHaveBeenCalledTimes(1);
    expect(mockFocusListeners).toHaveLength(1);
  });

  it("lets the user resolve the gate again once back on the screen", () => {
    const { result } = renderViewModel();
    const refreshGate = jest.fn();

    act(() => result.current.onResolveGate?.(refreshGate));
    act(() => mockFocusListeners[0]());
    act(() => result.current.onResolveGate?.(refreshGate));

    expect(refreshGate).toHaveBeenCalledTimes(1);
    expect(mockTronGateAction).toHaveBeenCalledTimes(2);
    expect(mockStopListening).toHaveBeenCalledTimes(1);
  });

  it("stops waiting for the user's return once the screen is gone", () => {
    const { result, unmount } = renderViewModel();

    act(() => result.current.onResolveGate?.(jest.fn()));
    unmount();

    expect(mockStopListening).toHaveBeenCalledTimes(1);
  });
});
