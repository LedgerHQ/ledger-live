import Share from "react-native-share";
import { act, renderHook } from "@tests/test-renderer";
import { setEnv } from "@shared/env";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { State } from "~/reducers/types";
import { sendFile } from "~/e2e/bridge/client";
import logger from "~/logger";
import { getExportFileName, useHistoryExportPort } from "../useHistoryExportPort";

jest.mock("~/e2e/bridge/client", () => ({ sendFile: jest.fn() }));
jest.mock("~/logger", () => ({ __esModule: true, default: { critical: jest.fn() } }));

const mockedShareOpen = jest.mocked(Share.open);

const BTC_ACCOUNT = genAccount("history-export-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 2,
});
const ETH_ACCOUNT = genAccount("history-export-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
});

function renderPort(discreetMode = false) {
  return renderHook(() => useHistoryExportPort(), {
    overrideInitialState: (state: State) => ({
      ...state,
      accounts: { ...state.accounts, active: [BTC_ACCOUNT, ETH_ACCOUNT] },
      settings: { ...state.settings, discreetMode },
    }),
  });
}

const sharedCsv = () => {
  const { url } = mockedShareOpen.mock.calls[0][0];
  return Buffer.from(String(url).replace("data:text/csv;base64,", ""), "base64").toString();
};

describe("useHistoryExportPort", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedShareOpen.mockResolvedValue({ success: true, message: "" });
    setEnv("DETOX", "");
  });

  afterEach(() => {
    setEnv("DETOX", "");
  });

  it("lists the accounts with their currency and a balance with its ticker", () => {
    const { result } = renderPort();

    expect(result.current.accounts.map(({ id, currency }) => ({ id, currency }))).toEqual([
      { id: BTC_ACCOUNT.id, currency: { id: "bitcoin", ticker: "BTC" } },
      { id: ETH_ACCOUNT.id, currency: { id: "ethereum", ticker: "ETH" } },
    ]);
    expect(result.current.accounts[0].name).toEqual(expect.any(String));
    expect(result.current.accounts[0].formattedBalance).toMatch(/BTC$/);
  });

  it("hides the balances in discreet mode", () => {
    const { result } = renderPort(true);

    expect(result.current.accounts[0].formattedBalance).toContain("***");
  });

  it("shares only the requested accounts as a CSV file and reports it saved", async () => {
    const { result } = renderPort();

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.exportCsv([ETH_ACCOUNT.id]);
    });

    expect(outcome).toBe("saved");
    expect(mockedShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text/csv",
        saveToFiles: true,
        failOnCancel: false,
        filename: getExportFileName(new Date()),
        url: expect.stringMatching(/^data:text\/csv;base64,/),
      }),
    );
    const csv = sharedCsv();
    expect(csv).toMatch(/^Operation Date,Status,Currency Ticker,/);
    expect(csv).toContain(",ETH,");
    expect(csv).not.toContain(",BTC,");
  });

  it("reports canceled when the share sheet is dismissed", async () => {
    mockedShareOpen.mockResolvedValue({ success: false, message: "", dismissedAction: true });
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ACCOUNT.id])).resolves.toBe("canceled");
  });

  it("reports canceled when the share is canceled with its error code", async () => {
    mockedShareOpen.mockRejectedValue({ error: { code: "ECANCELLED500" } });
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ACCOUNT.id])).resolves.toBe("canceled");
    expect(logger.critical).not.toHaveBeenCalled();
  });

  it("reports failed and logs any other share error", async () => {
    const error = new Error("share failed");
    mockedShareOpen.mockRejectedValue(error);
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ACCOUNT.id])).resolves.toBe("failed");
    expect(logger.critical).toHaveBeenCalledWith(error);
  });

  it("sends the file to the e2e bridge instead of sharing it under Detox", async () => {
    setEnv("DETOX", "1");
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ACCOUNT.id])).resolves.toBe("saved");
    expect(mockedShareOpen).not.toHaveBeenCalled();
    expect(sendFile).toHaveBeenCalledWith({
      fileName: getExportFileName(new Date()),
      fileContent: expect.stringMatching(/^Operation Date,/),
    });
  });

  it("reports the requested accounts as not syncing when no sync is pending", () => {
    const { result } = renderPort();

    expect(result.current.isSyncing([BTC_ACCOUNT.id])).toBe(false);
  });

  it("names the file after the local date", () => {
    expect(getExportFileName(new Date(2026, 0, 5))).toBe("ledgerwallet-operations-2026.01.05.csv");
  });
});
