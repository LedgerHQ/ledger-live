import { FlowName, getCurrencyName, getFlowName } from "./utils";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";

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
      expect(getFlowName(undefined, {})).toBe(FlowName.unknown);
    });

    it("map for receiveFlow and swapFlow", () => {
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.receiveFlow, {})).toBe(FlowName.receive);
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.swapFlow, {})).toBe(FlowName.swap);
    });

    it("sendFlow + transaction.mode === 'send' -> 'send'", () => {
      const req = { transaction: { mode: "send" } };
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendFlow, req)).toBe(FlowName.send);
    });

    it("sendFlow + transaction.mode !== 'send' -> 'staking'", () => {
      const req1 = { transaction: { mode: "delegate" } };
      const req2 = { transaction: {} };
      const req3 = {};
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendFlow, req1)).toBe(FlowName.staking);
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendFlow, req2)).toBe(FlowName.staking);
      expect(getFlowName(HOOKS_TRACKING_LOCATIONS.sendFlow, req3)).toBe(FlowName.staking);
    });

    it("return empty string if location is not in the map", () => {
      const unknown = HOOKS_TRACKING_LOCATIONS.ledgerSyncFlow;
      expect(getFlowName(unknown, {})).toBe(FlowName.unknown);
    });
  });
});
