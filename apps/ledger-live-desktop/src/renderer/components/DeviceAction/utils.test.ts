import { getCurrencyName, getFlowName } from "./utils";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

type MinimalAccount = { currency?: { name?: string } };
type MinimalRequest = { tokenCurrency?: { name?: string }; account?: MinimalAccount } | unknown;

describe("utils", () => {
  describe("getCurrencyName", () => {
    it("return '' if request is null/undefined or non-objet", () => {
      expect(getCurrencyName(null as unknown)).toBe("");
      expect(getCurrencyName(undefined as unknown)).toBe("");
      expect(getCurrencyName("string" as unknown)).toBe("");
      expect(getCurrencyName(123 as unknown)).toBe("");
      expect(getCurrencyName(true as unknown)).toBe("");
    });

    it("return Token Currency Name", () => {
      const req: MinimalRequest = { tokenCurrency: { name: "USDT" } };
      expect(getCurrencyName(req)).toBe("USDT");
    });

    it("return Curreny Name in Account", () => {
      const req: MinimalRequest = { account: { currency: { name: "Bitcoin" } } };
      expect(getCurrencyName(req)).toBe("Bitcoin");
    });

    it("return token currency name if tokenCurrency and account", () => {
      const req: MinimalRequest = {
        tokenCurrency: { name: "USDC" },
        account: { currency: { name: "Ethereum" } },
      };
      expect(getCurrencyName(req)).toBe("USDC");
    });

    it("return empty string if no data", () => {
      const req: MinimalRequest = {};
      expect(getCurrencyName(req)).toBe("");
    });
  });

  describe("getFlowName", () => {
    it("return empty string if location is undefined", () => {
      expect(getFlowName(undefined, {})).toBe("");
    });

    it("map for receiveFlow and swapFlow", () => {
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.receiveModal, {})).toBe("receive");
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.exchange, {})).toBe("swap");
    });

    it("sendFlow + transaction.mode === 'send' -> 'send'", () => {
      const req = { transaction: { mode: "send" } };
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendModal, req)).toBe("send");
    });

    it("sendFlow + transaction.mode !== 'send' -> 'staking'", () => {
      const req1 = { transaction: { mode: "delegate" } };
      const req2 = { transaction: {} }; // mode undefined
      const req3 = {}; // pas de transaction
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendModal, req1)).toBe("staking");
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend, req2)).toBe(
        "staking",
      );
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendModal, req3)).toBe("staking");
    });

    it("return empty string if location is not in the map", () => {
      const unknown = HOOKS_TRACKING_LOCATIONS.ledgerSync;
      expect(getFlowName(unknown, {})).toBe("");
    });
  });
});
