import type { AccountLike } from "@ledgerhq/types-live";
import { createAccountReceiveHandler } from "../accountReceive";
import * as receiveOnAccount from "../../logic/receiveOnAccount";
import { makeHandlerDeps, getDepsFrom } from "./testHelpers";

jest.mock("../../logic/receiveOnAccount");

const mockedReceiveOnAccountLogic = jest.mocked(receiveOnAccount.receiveOnAccountLogic);

const account = { id: "js:2:ethereum:0x012:" } as AccountLike;
const accountAddress = "0xabc";

beforeEach(() => {
  mockedReceiveOnAccountLogic.mockReset();
});

describe("createAccountReceiveHandler", () => {
  it("throws when the UI handler is not configured", () => {
    const deps = makeHandlerDeps({ uiAccountReceive: undefined });
    const handler = createAccountReceiveHandler(getDepsFrom(deps));

    expect(() => handler({ accountId: "id", tokenCurrency: undefined })).toThrow(
      "account.receive UI handler not configured",
    );
  });

  it("resolves with the address and tracks success on the UI success callback", async () => {
    const uiAccountReceive = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess(accountAddress);
    });
    const deps = makeHandlerDeps({ uiAccountReceive });
    // Run the bridge passed to the logic and surface its promise back to the handler.
    mockedReceiveOnAccountLogic.mockImplementation((_state, _ctx, _accountId, uiNavigation) =>
      uiNavigation(account, undefined, accountAddress),
    );

    const handler = createAccountReceiveHandler(getDepsFrom(deps));
    const result = await handler({ accountId: "id", tokenCurrency: undefined });

    expect(result).toBe(accountAddress);
    expect(uiAccountReceive).toHaveBeenCalledWith(
      expect.objectContaining({
        account,
        parentAccount: undefined,
        accountAddress,
      }),
    );
    expect(deps.tracking.receiveSuccess).toHaveBeenCalledTimes(1);
    expect(deps.tracking.receiveFail).not.toHaveBeenCalled();
  });

  it("rejects with the error and tracks failure on the UI error callback", async () => {
    const error = new Error("boom");
    const uiAccountReceive = jest.fn().mockImplementation(({ onError }) => {
      onError(error);
    });
    const deps = makeHandlerDeps({ uiAccountReceive });
    mockedReceiveOnAccountLogic.mockImplementation((_state, _ctx, _accountId, uiNavigation) =>
      uiNavigation(account, undefined, accountAddress),
    );

    const handler = createAccountReceiveHandler(getDepsFrom(deps));

    await expect(handler({ accountId: "id", tokenCurrency: undefined })).rejects.toBe(error);
    expect(deps.tracking.receiveFail).toHaveBeenCalledTimes(1);
    expect(deps.tracking.receiveSuccess).not.toHaveBeenCalled();
  });

  it("rejects with 'User cancelled' and tracks failure on the UI cancel callback", async () => {
    const uiAccountReceive = jest.fn().mockImplementation(({ onCancel }) => {
      onCancel();
    });
    const deps = makeHandlerDeps({ uiAccountReceive });
    mockedReceiveOnAccountLogic.mockImplementation((_state, _ctx, _accountId, uiNavigation) =>
      uiNavigation(account, undefined, accountAddress),
    );

    const handler = createAccountReceiveHandler(getDepsFrom(deps));

    await expect(handler({ accountId: "id", tokenCurrency: undefined })).rejects.toThrow(
      "User cancelled",
    );
    expect(deps.tracking.receiveFail).toHaveBeenCalledTimes(1);
  });
});
