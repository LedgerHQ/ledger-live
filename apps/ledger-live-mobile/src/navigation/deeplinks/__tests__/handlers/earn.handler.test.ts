import { getStateFromPath } from "@react-navigation/native";
import { earnHandler } from "../../handlers/earn";
import {
  validateEarnAction,
  validateEarnInfoModal,
  validateEarnMenuModal,
  validateEarnDepositScreen,
  logSecurityEvent,
  EarnDeeplinkAction,
} from "../../validation";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

jest.mock("../../validation", () => ({
  validateEarnAction: jest.fn(),
  validateEarnInfoModal: jest.fn(),
  validateEarnMenuModal: jest.fn(),
  validateEarnDepositScreen: jest.fn(),
  logSecurityEvent: jest.fn(),
  EarnDeeplinkAction: {
    INFO_MODAL: "info-modal",
    MENU_MODAL: "menu-modal",
    PROTOCOL_INFO_MODAL: "protocol-info-modal",
    GET_FUNDS: "get-funds",
    GO_BACK: "go-back",
    STAKE: "stake",
    STAKE_ACCOUNT: "stake-account",
  },
}));

jest.mock("~/actions/earn", () => ({
  makeSetEarnInfoModalAction: jest.fn((payload: unknown) => ({
    type: "SET_EARN_INFO_MODAL",
    payload,
  })),
  makeSetEarnMenuModalAction: jest.fn((payload: unknown) => ({
    type: "SET_EARN_MENU_MODAL",
    payload,
  })),
  makeSetEarnProtocolInfoModalAction: jest.fn((payload: unknown) => ({
    type: "SET_EARN_PROTOCOL_INFO_MODAL",
    payload,
  })),
}));


function makeParsed(params: Record<string, string> = {}, pathname = ""): ParsedDeeplink {
  const search = new URLSearchParams(params).toString();
  const fullPath = search ? `earn${pathname}?${search}` : `earn${pathname}`;
  const url = new URL(`ledgerwallet://${fullPath}`);
  // Manually set pathname on the url to mimic router behaviour
  if (pathname) url.pathname = pathname;
  return {
    hostname: "earn",
    pathname: pathname || "",
    platform: "",
    searchParams: url.searchParams,
    query: Object.fromEntries(url.searchParams),
    rawPath: fullPath,
    url,
  };
}

describe("earnHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);
  const mockedValidateAction = jest.mocked(validateEarnAction);
  const mockedValidateInfoModal = jest.mocked(validateEarnInfoModal);
  const mockedValidateMenuModal = jest.mocked(validateEarnMenuModal);
  const mockedValidateDeposit = jest.mocked(validateEarnDepositScreen);
  const mockedLogSecurity = jest.mocked(logSecurityEvent);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
    mockedValidateAction.mockClear();
    mockedValidateInfoModal.mockClear();
    mockedValidateMenuModal.mockClear();
    mockedValidateDeposit.mockClear();
    mockedLogSecurity.mockClear();
  });

  describe("invalid action param", () => {
    it("logs a security event and returns undefined", () => {
      mockedValidateAction.mockReturnValue(null);

      const result = earnHandler(makeParsed({ action: "malicious" }), makeContext());

      expect(mockedLogSecurity).toHaveBeenCalledWith("blocked_action", expect.any(Object));
      expect(result).toBeUndefined();
    });
  });

  describe("no action param", () => {
    it("falls through without logging a security event", () => {
      mockedValidateAction.mockReturnValue(null);

      earnHandler(makeParsed(), makeContext());

      expect(mockedLogSecurity).not.toHaveBeenCalled();
    });
  });

  describe("action = info-modal", () => {
    it("dispatches makeSetEarnInfoModalAction when validation passes", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.INFO_MODAL);
      const validModal = { message: "hello", messageTitle: "title", learnMoreLink: "" };
      mockedValidateInfoModal.mockReturnValue(validModal);
      const context = makeContext();

      earnHandler(makeParsed({ action: "info-modal" }), context);

      expect(context.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_EARN_INFO_MODAL", payload: validModal }),
      );
    });

    it("logs security event and returns undefined when validation fails", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.INFO_MODAL);
      mockedValidateInfoModal.mockReturnValue(null);

      const result = earnHandler(makeParsed({ action: "info-modal" }), makeContext());

      expect(mockedLogSecurity).toHaveBeenCalledWith("validation_failed", expect.any(Object));
      expect(result).toBeUndefined();
    });

    it("returns undefined (dispatch only, no navigation)", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.INFO_MODAL);
      mockedValidateInfoModal.mockReturnValue({
        message: "msg",
        messageTitle: "title",
        learnMoreLink: "",
      });

      const result = earnHandler(makeParsed({ action: "info-modal" }), makeContext());

      expect(result).toBeUndefined();
    });
  });

  describe("action = menu-modal", () => {
    it("dispatches makeSetEarnMenuModalAction when validation passes", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.MENU_MODAL);
      const validModal = { title: "Options", options: [] };
      mockedValidateMenuModal.mockReturnValue(validModal);
      const context = makeContext();

      earnHandler(makeParsed({ action: "menu-modal" }), context);

      expect(context.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_EARN_MENU_MODAL" }),
      );
    });

    it("logs security event and returns undefined when validation fails", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.MENU_MODAL);
      mockedValidateMenuModal.mockReturnValue(null);

      const result = earnHandler(makeParsed({ action: "menu-modal" }), makeContext());

      expect(mockedLogSecurity).toHaveBeenCalledWith("validation_failed", expect.any(Object));
      expect(result).toBeUndefined();
    });
  });

  describe("action = protocol-info-modal", () => {
    it("dispatches makeSetEarnProtocolInfoModalAction(true)", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.PROTOCOL_INFO_MODAL);
      const context = makeContext();

      earnHandler(makeParsed({ action: "protocol-info-modal" }), context);

      expect(context.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_EARN_PROTOCOL_INFO_MODAL", payload: true }),
      );
    });

    it("returns undefined (dispatch only, no navigation)", () => {
      mockedValidateAction.mockReturnValue(EarnDeeplinkAction.PROTOCOL_INFO_MODAL);

      const result = earnHandler(makeParsed({ action: "protocol-info-modal" }), makeContext());

      expect(result).toBeUndefined();
    });
  });

  describe("deposit path", () => {
    it("calls getStateFromPath with action=deposit and sanitised params", () => {
      mockedValidateAction.mockReturnValue(null);
      mockedValidateDeposit.mockReturnValue({ cryptoAssetId: "ethereum", accountId: "acc123" });

      earnHandler(
        makeParsed({ cryptoAssetId: "ethereum", accountId: "acc123" }, "/deposit"),
        makeContext(),
      );

      const [path] = mockedGetStateFromPath.mock.calls[0];
      expect(path).toContain("action=deposit");
      expect(path).toContain("cryptoAssetId=ethereum");
      expect(path).toContain("accountId=acc123");
    });

    it("returns the navigation state from getStateFromPath", () => {
      mockedValidateAction.mockReturnValue(null);
      mockedValidateDeposit.mockReturnValue({ cryptoAssetId: "bitcoin", accountId: "" });

      const result = earnHandler(makeParsed({}, "/deposit"), makeContext());

      expect(result).toBeDefined();
      expect(mockedGetStateFromPath).toHaveBeenCalled();
    });
  });
});
