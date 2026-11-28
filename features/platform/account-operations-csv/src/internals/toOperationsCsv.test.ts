import { mockAccountOperation } from "@domain/entity-account-operation/schema.mock";
import type { CryptoOrTokenCurrencyId, Currency } from "@domain/entity-currency";
import { mockEthereumCurrency } from "@domain/entity-currency-crypto/schema.mock";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { mockFiatCurrency } from "@domain/entity-currency-fiat/schema.mock";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { toOperationsCsv, type OperationsCsvCountervalue } from "./toOperationsCsv";

const HEADER =
  "Operation Date,Status,Currency Ticker,Operation Type,Operation Amount,Operation Fees,Operation Hash,Account Name,Account xpub,Countervalue Ticker,Countervalue at Operation Date,Countervalue at CSV Export";

const ETHEREUM = mockEthereumCurrency();
const USDT = mockTokenCurrency();
const USD = mockFiatCurrency({
  units: [{ name: "US Dollar", code: "USD", magnitude: 2, showAllDigits: true }],
});

const currencies = new Map<string, Currency>([
  [ETHEREUM.id, ETHEREUM],
  [USDT.id, USDT],
]);
const currencyOf = (assetId: CryptoOrTokenCurrencyId) => currencies.get(assetId);

const countervalue: OperationsCsvCountervalue = {
  currency: USD,
  fiatTicker: FiatCurrencyTickerSchema.parse("USD"),
  valueOf: (_amount, _from, date) => (date ? undefined : 250000),
};

const account = (operations: ReturnType<typeof mockAccountOperation>[]) => ({
  name: "Ethereum 1",
  xpub: "0xabc",
  nativeAssetId: ETHEREUM.id,
  operations,
});

const lines = (csv: string) => csv.split("\r\n");

describe("toOperationsCsv", () => {
  it("writes only the header when there is no operation", () => {
    expect(toOperationsCsv({ accounts: [account([])], currencyOf })).toBe(HEADER);
  });

  it("writes one row per operation with its amount, fee and countervalues", () => {
    const csv = toOperationsCsv({
      accounts: [
        account([
          mockAccountOperation({
            value: "1500000000000000000",
            fee: "21000000000000",
            countervalues: { USD: "300000" },
          }),
        ]),
      ],
      currencyOf,
      countervalue,
    });

    expect(lines(csv)).toEqual([
      HEADER,
      "2026-01-01T00:00:00.000Z,Confirmed,ETH,OUT,1.5,0.000021,0xhash1,Ethereum 1,0xabc,USD,3000.00,2500.00",
    ]);
  });

  it("leaves the fee of token rows empty and writes their own ticker and unit", () => {
    const csv = toOperationsCsv({
      accounts: [account([mockAccountOperation({ assetId: USDT.id, value: "2500000", fee: "0" })])],
      currencyOf,
    });

    expect(lines(csv)[1]).toBe(
      "2026-01-01T00:00:00.000Z,Confirmed,USDT,OUT,2.5,,0xhash1,Ethereum 1,0xabc,,,",
    );
  });

  it("marks failed operations and leaves pending ones out", () => {
    const csv = toOperationsCsv({
      accounts: [
        account([
          mockAccountOperation({ id: "pending", blockHeight: null }),
          mockAccountOperation({ id: "failed", hash: "0xfailed", hasFailed: true }),
        ]),
      ],
      currencyOf,
    });

    expect(lines(csv)).toHaveLength(2);
    expect(lines(csv)[1]).toContain(",Failed,ETH,OUT,");
    expect(lines(csv)[1]).toContain(",0xfailed,");
  });

  it("leaves a missing or zero countervalue empty", () => {
    const csv = toOperationsCsv({
      accounts: [account([mockAccountOperation({ countervalues: { USD: "0" } })])],
      currencyOf,
      countervalue: { ...countervalue, valueOf: () => undefined },
    });

    expect(lines(csv)[1].endsWith(",USD,,")).toBe(true);
  });

  it("values the operation at its date from the rates when the read did not value it", () => {
    const valueOf = jest.fn((_amount: string, _from: Currency, date?: Date) =>
      date ? 120000 : 250000,
    );
    const operation = mockAccountOperation({ value: "1000000000000000000" });

    const csv = toOperationsCsv({
      accounts: [account([operation])],
      currencyOf,
      countervalue: { currency: USD, valueOf },
    });

    expect(valueOf).toHaveBeenCalledWith(operation.value, ETHEREUM, new Date(operation.date));
    expect(lines(csv)[1].endsWith(",USD,1200.00,2500.00")).toBe(true);
  });

  it("prefers the value the read gave at the operation date", () => {
    const valueOf = jest.fn((_amount: string, _from: Currency, date?: Date) =>
      date ? 120000 : 250000,
    );

    const csv = toOperationsCsv({
      accounts: [account([mockAccountOperation({ countervalues: { USD: "300000" } })])],
      currencyOf,
      countervalue: { ...countervalue, valueOf },
    });

    expect(lines(csv)[1].endsWith(",USD,3000.00,2500.00")).toBe(true);
    expect(valueOf).toHaveBeenCalledTimes(1);
  });

  it("strips the separators the CSV does not escape", () => {
    const csv = toOperationsCsv({
      accounts: [{ ...account([mockAccountOperation()]), name: "My, account\r\n" }],
      currencyOf,
    });

    expect(lines(csv)[1]).toContain(",My account,");
  });

  it("keeps the order of the accounts and of their operations", () => {
    const csv = toOperationsCsv({
      accounts: [
        account([
          mockAccountOperation({ id: "a", hash: "0xa" }),
          mockAccountOperation({ id: "b", hash: "0xb" }),
        ]),
        { ...account([mockAccountOperation({ id: "c", hash: "0xc" })]), name: "Ethereum 2" },
      ],
      currencyOf,
    });

    expect(
      lines(csv)
        .slice(1)
        .map(line => line.split(",")[6]),
    ).toEqual(["0xa", "0xb", "0xc"]);
  });
});
