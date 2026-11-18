import Config from "react-native-config";
import Share from "react-native-share";
import { act, renderHook } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { AccountIdSchema } from "@domain/entity-account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { State } from "~/reducers/types";
import { sendFile } from "~/e2e/bridge/client";
import logger from "~/logger";
import { useHistoryExportPort } from "../useHistoryExportPort";

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
const BTC_ID = AccountIdSchema.parse(BTC_ACCOUNT.id);
const ETH_ID = AccountIdSchema.parse(ETH_ACCOUNT.id);

const EXPORT_DATE = new Date(2026, 10, 18, 12);
const EXPORT_FILE_NAME = "ledgerwallet-operations-2026.11.18";

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
    jest.useFakeTimers({ now: EXPORT_DATE, advanceTimers: true });
    mockedShareOpen.mockResolvedValue({ success: true, message: "" });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("lists the accounts with their currency and a balance with its ticker", () => {
    const { result } = renderPort();

    expect(result.current.accounts.map(({ id, currency }) => ({ id, currency }))).toEqual([
      { id: BTC_ID, currency: { id: "bitcoin", ticker: "BTC" } },
      { id: ETH_ID, currency: { id: "ethereum", ticker: "ETH" } },
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
      outcome = await result.current.exportCsv([ETH_ID]);
    });

    expect(outcome).toBe("saved");
    expect(mockedShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text/csv",
        saveToFiles: true,
        failOnCancel: false,
        filename: EXPORT_FILE_NAME,
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

    await expect(result.current.exportCsv([BTC_ID])).resolves.toBe("canceled");
  });

  it("reports canceled when the iOS save to files picker is canceled", async () => {
    mockedShareOpen.mockRejectedValue(Object.assign(new Error("CANCELLED"), { code: "CANCELLED" }));
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ID])).resolves.toBe("canceled");
    expect(logger.critical).not.toHaveBeenCalled();
  });

  it("reports failed and logs any other share error", async () => {
    const error = new Error("share failed");
    mockedShareOpen.mockRejectedValue(error);
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ID])).resolves.toBe("failed");
    expect(logger.critical).toHaveBeenCalledWith(error);
  });

  it("logs a non-Error rejection as an Error", async () => {
    mockedShareOpen.mockRejectedValue("share failed");
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ID])).resolves.toBe("failed");
    expect(logger.critical).toHaveBeenCalledWith(new Error("share failed"));
  });

  it("sends the file to the e2e bridge instead of sharing it under Detox", async () => {
    const detox = jest.replaceProperty(Config, "DETOX", "1");
    const { result } = renderPort();

    await expect(result.current.exportCsv([BTC_ID])).resolves.toBe("saved");
    expect(mockedShareOpen).not.toHaveBeenCalled();
    expect(sendFile).toHaveBeenCalledWith({
      fileName: `${EXPORT_FILE_NAME}.csv`,
      fileContent: expect.stringMatching(/^Operation Date,/),
    });
    detox.restore();
  });

  it("reports the requested accounts as not syncing when no sync is pending", () => {
    const { result } = renderPort();

    expect(result.current.isSyncing([BTC_ID])).toBe(false);
  });
});
