import type { AccountLike, AnyMessage } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { createMessageSignHandler } from "../messageSign";
import * as signMessage from "../../logic/signMessage";
import { makeHandlerDeps, getDepsFrom } from "./testHelpers";

jest.mock("../../logic/signMessage");

const mockedSignMessageLogic = jest.mocked(signMessage.signMessageLogic);

const account = { id: "js:2:ethereum:0x012:" } as AccountLike;
const anyMessage = { message: "hello" } as unknown as AnyMessage;

const baseParams = {
  accountId: "id",
  message: Buffer.from("hello"),
  options: undefined,
} as unknown as Parameters<ReturnType<typeof createMessageSignHandler>>[0];

beforeEach(() => {
  mockedSignMessageLogic.mockReset();
});

describe("createMessageSignHandler", () => {
  it("throws when the UI handler is not configured", () => {
    const deps = makeHandlerDeps({ uiMessageSign: undefined });
    const handler = createMessageSignHandler(getDepsFrom(deps));

    expect(() => handler(baseParams)).toThrow("message.sign UI handler not configured");
  });

  it("maps a 0x-prefixed signature to a hex Buffer and tracks success", async () => {
    const uiMessageSign = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess("0xdeadbeef");
    });
    const deps = makeHandlerDeps({ uiMessageSign });
    mockedSignMessageLogic.mockImplementation((_ctx, _accountId, _message, uiNavigation) =>
      uiNavigation(account, anyMessage),
    );

    const handler = createMessageSignHandler(getDepsFrom(deps));
    const result = await handler(baseParams);

    expect(result).toEqual(Buffer.from("deadbeef", "hex"));
    expect(deps.tracking.signMessageSuccess).toHaveBeenCalledTimes(1);
    expect(deps.tracking.signMessageFail).not.toHaveBeenCalled();
  });

  it("maps a non-0x signature to a utf8 Buffer", async () => {
    const uiMessageSign = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess("plain");
    });
    const deps = makeHandlerDeps({ uiMessageSign });
    mockedSignMessageLogic.mockImplementation((_ctx, _accountId, _message, uiNavigation) =>
      uiNavigation(account, anyMessage),
    );

    const handler = createMessageSignHandler(getDepsFrom(deps));
    const result = await handler(baseParams);

    expect(result).toEqual(Buffer.from("plain"));
  });

  it("rejects with the error and tracks failure on the UI error callback", async () => {
    const error = new Error("boom");
    const uiMessageSign = jest.fn().mockImplementation(({ onError }) => {
      onError(error);
    });
    const deps = makeHandlerDeps({ uiMessageSign });
    mockedSignMessageLogic.mockImplementation((_ctx, _accountId, _message, uiNavigation) =>
      uiNavigation(account, anyMessage),
    );

    const handler = createMessageSignHandler(getDepsFrom(deps));

    await expect(handler(baseParams)).rejects.toBe(error);
    expect(deps.tracking.signMessageFail).toHaveBeenCalledTimes(1);
    expect(deps.tracking.signMessageSuccess).not.toHaveBeenCalled();
  });

  it("rejects with UserRefusedOnDevice and tracks failure on the UI cancel callback", async () => {
    const uiMessageSign = jest.fn().mockImplementation(({ onCancel }) => {
      onCancel();
    });
    const deps = makeHandlerDeps({ uiMessageSign });
    mockedSignMessageLogic.mockImplementation((_ctx, _accountId, _message, uiNavigation) =>
      uiNavigation(account, anyMessage),
    );

    const handler = createMessageSignHandler(getDepsFrom(deps));

    await expect(handler(baseParams)).rejects.toBeInstanceOf(UserRefusedOnDevice);
    expect(deps.tracking.signMessageFail).toHaveBeenCalledTimes(1);
  });
});
