import { BigNumber } from "bignumber.js";
import { syncAmountInputs } from "../amountInputSync";

const mockCryptoUnit = {
  code: "BTC",
  name: "bitcoin",
  magnitude: 8,
  symbol: "₿",
};

const mockFiatUnit = {
  code: "USD",
  name: "US Dollar",
  magnitude: 2,
  symbol: "$",
};

describe("syncAmountInputs", () => {
  it("should handle null last amounts and sync both inputs", () => {
    const setCryptoInputValue = jest.fn();
    const setFiatInputValue = jest.fn();

    const lastTransactionAmountRef = { current: null };
    const lastFiatAmountRef = { current: null };
    const lastUseAllAmountRef = { current: false };
    const lastUserInputTimeRef = { current: 0 };

    syncAmountInputs({
      cryptoAmount: new BigNumber("123456789"),
      fiatAmount: new BigNumber("123456"),
      transactionUseAllAmount: false,
      inputMode: "fiat",
      cryptoInputValue: "",
      fiatInputValue: "",
      locale: "en-US",
      accountUnit: mockCryptoUnit,
      fiatUnit: mockFiatUnit,
      lastTransactionAmountRef,
      lastFiatAmountRef,
      lastUseAllAmountRef,
      lastUserInputTimeRef,
      setCryptoInputValue,
      setFiatInputValue,
    });

    expect(setCryptoInputValue).toHaveBeenCalledWith("1.23456789");
    expect(setFiatInputValue).toHaveBeenCalledWith("1234.56");
    expect(lastTransactionAmountRef.current?.toString()).toBe("123456789");
    expect(lastFiatAmountRef.current?.toString()).toBe("123456");
  });

  it("should sync immediately when useAllAmount changes", () => {
    const setCryptoInputValue = jest.fn();
    const setFiatInputValue = jest.fn();

    const lastTransactionAmountRef = { current: new BigNumber(0) };
    const lastFiatAmountRef = { current: new BigNumber(0) };
    const lastUseAllAmountRef = { current: false };
    const lastUserInputTimeRef = { current: Date.now() };

    syncAmountInputs({
      cryptoAmount: new BigNumber("50000000"),
      fiatAmount: new BigNumber("250000"),
      transactionUseAllAmount: true,
      inputMode: "crypto",
      cryptoInputValue: "0.5",
      fiatInputValue: "2500",
      locale: "en-US",
      accountUnit: mockCryptoUnit,
      fiatUnit: mockFiatUnit,
      lastTransactionAmountRef,
      lastFiatAmountRef,
      lastUseAllAmountRef,
      lastUserInputTimeRef,
      setCryptoInputValue,
      setFiatInputValue,
    });

    expect(lastUseAllAmountRef.current).toBe(true);
    expect(lastUserInputTimeRef.current).toBe(0);
    expect(setCryptoInputValue).toHaveBeenCalledWith("0.5");
    expect(setFiatInputValue).toHaveBeenCalledWith("2500");
  });

  it("should repopulate inputs when both are empty after remount", () => {
    const setCryptoInputValue = jest.fn();
    const setFiatInputValue = jest.fn();

    const cryptoAmount = new BigNumber("100000000");
    const fiatAmount = new BigNumber("300000");
    const lastTransactionAmountRef = { current: cryptoAmount };
    const lastFiatAmountRef = { current: fiatAmount };
    const lastUseAllAmountRef = { current: false };
    const lastUserInputTimeRef = { current: 0 };

    syncAmountInputs({
      cryptoAmount,
      fiatAmount,
      transactionUseAllAmount: false,
      inputMode: "fiat",
      cryptoInputValue: "",
      fiatInputValue: "",
      locale: "en-US",
      accountUnit: mockCryptoUnit,
      fiatUnit: mockFiatUnit,
      lastTransactionAmountRef,
      lastFiatAmountRef,
      lastUseAllAmountRef,
      lastUserInputTimeRef,
      setCryptoInputValue,
      setFiatInputValue,
    });

    expect(setCryptoInputValue).toHaveBeenCalledWith("1");
    expect(setFiatInputValue).toHaveBeenCalledWith("3000");
  });
  it("should not override inputs when cryptoAmount changes shortly after user typing", () => {
    const setCryptoInputValue = jest.fn();
    const setFiatInputValue = jest.fn();
    const lastTransactionAmountRef = { current: new BigNumber("100000000") };
    const lastFiatAmountRef = { current: new BigNumber("300000") };
    const lastUseAllAmountRef = { current: false };
    const lastUserInputTimeRef = { current: Date.now() };
    // User is actively typing these values; they may not match the on-chain amounts yet.
    const cryptoInputValue = "1.5";
    const fiatInputValue = "4500";
    syncAmountInputs({
      cryptoAmount: new BigNumber("200000000"),
      fiatAmount: new BigNumber("600000"),
      transactionUseAllAmount: false,
      inputMode: "crypto",
      cryptoInputValue,
      fiatInputValue,
      locale: "en-US",
      accountUnit: mockCryptoUnit,
      fiatUnit: mockFiatUnit,
      lastTransactionAmountRef,
      lastFiatAmountRef,
      lastUseAllAmountRef,
      lastUserInputTimeRef,
      setCryptoInputValue,
      setFiatInputValue,
    });
    expect(setCryptoInputValue).not.toHaveBeenCalled();
    expect(setFiatInputValue).not.toHaveBeenCalled();
  });
  it("should update fiat input when fiatAmount changes independently of cryptoAmount", () => {
    const setCryptoInputValue = jest.fn();
    const setFiatInputValue = jest.fn();
    const cryptoAmount = new BigNumber("100000000");
    const previousFiatAmount = new BigNumber("300000");
    const newFiatAmount = new BigNumber("350000");
    const lastTransactionAmountRef = { current: cryptoAmount };
    const lastFiatAmountRef = { current: previousFiatAmount };
    const lastUseAllAmountRef = { current: false };
    const lastUserInputTimeRef = { current: 0 };
    syncAmountInputs({
      cryptoAmount,
      fiatAmount: newFiatAmount,
      transactionUseAllAmount: false,
      inputMode: "fiat",
      cryptoInputValue: "1",
      fiatInputValue: "3000",
      locale: "en-US",
      accountUnit: mockCryptoUnit,
      fiatUnit: mockFiatUnit,
      lastTransactionAmountRef,
      lastFiatAmountRef,
      lastUseAllAmountRef,
      lastUserInputTimeRef,
      setCryptoInputValue,
      setFiatInputValue,
    });
    // 350000 with magnitude 2 → "3500"
    expect(setFiatInputValue).toHaveBeenCalledWith("3500");
    expect(lastFiatAmountRef.current?.toString()).toBe("350000");
  });
  it("should sync inputs when useAllAmount toggles on and inputs are empty", () => {
    const setCryptoInputValue = jest.fn();
    const setFiatInputValue = jest.fn();
    const cryptoAmount = new BigNumber("250000000"); // 2.5 BTC
    const fiatAmount = new BigNumber("750000"); // "7500"
    const lastTransactionAmountRef = { current: cryptoAmount };
    const lastFiatAmountRef = { current: fiatAmount };
    const lastUseAllAmountRef = { current: false };
    const lastUserInputTimeRef = { current: 0 };
    syncAmountInputs({
      cryptoAmount,
      fiatAmount,
      transactionUseAllAmount: true,
      inputMode: "crypto",
      cryptoInputValue: "",
      fiatInputValue: "",
      locale: "en-US",
      accountUnit: mockCryptoUnit,
      fiatUnit: mockFiatUnit,
      lastTransactionAmountRef,
      lastFiatAmountRef,
      lastUseAllAmountRef,
      lastUserInputTimeRef,
      setCryptoInputValue,
      setFiatInputValue,
    });
    expect(setCryptoInputValue).toHaveBeenCalledWith("2.5");
    expect(setFiatInputValue).toHaveBeenCalledWith("7500");
    expect(lastUseAllAmountRef.current).toBe(true);
  });
});
