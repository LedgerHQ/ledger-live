import type { Transaction } from "@ledgerhq/wallet-api-core";
import { createExchangeStartHandler, createExchangeCompleteHandler } from "../exchange";
import * as exchange from "../../logic/exchange";
import type { CompleteExchangeUiRequest } from "../../logic/exchange";
import { ExchangeType } from "../types";
import { makeHandlerDeps, getDepsFrom } from "./testHelpers";

jest.mock("../../logic/exchange");

const mockedStartExchangeLogic = jest.mocked(exchange.startExchangeLogic);
const mockedCompleteExchangeLogic = jest.mocked(exchange.completeExchangeLogic);

// The handler param is the wallet-api-server `ExchangeParams` discriminated union.
type CompleteParams = Parameters<ReturnType<typeof createExchangeCompleteHandler>>[0];

const transaction = { family: "ethereum" } as unknown as Transaction;

// The mocked logic short-circuits the real CompleteExchangeRequest -> CompleteExchangeUiRequest
// conversion, so feed the raw request straight to uiNavigation (typed as the UI request).
const passThroughUi = (
  _ctx: unknown,
  request: exchange.CompleteExchangeRequest,
  uiNavigation: (req: CompleteExchangeUiRequest) => Promise<string>,
) => uiNavigation(request as unknown as CompleteExchangeUiRequest);

beforeEach(() => {
  mockedStartExchangeLogic.mockReset();
  mockedCompleteExchangeLogic.mockReset();
});

describe("createExchangeStartHandler", () => {
  it("throws when the UI handler is not configured", () => {
    const deps = makeHandlerDeps({ uiExchangeStart: undefined });
    const handler = createExchangeStartHandler(getDepsFrom(deps));

    expect(() => handler({ exchangeType: "SWAP" })).toThrow(
      "exchange.start UI handler not configured",
    );
  });

  it("resolves with the nonce and tracks success on the UI success callback", async () => {
    const uiExchangeStart = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess("nonce-1");
    });
    const deps = makeHandlerDeps({ uiExchangeStart });
    mockedStartExchangeLogic.mockImplementation((_ctx, exchangeType, uiNavigation) =>
      uiNavigation(exchangeType),
    );

    const handler = createExchangeStartHandler(getDepsFrom(deps));
    const result = await handler({ exchangeType: "SWAP" });

    expect(result).toBe("nonce-1");
    expect(deps.tracking.startExchangeSuccess).toHaveBeenCalledTimes(1);
    expect(deps.tracking.completeExchangeFail).not.toHaveBeenCalled();
  });

  it("rejects with the error passed to onCancel and tracks failure", async () => {
    const error = new Error("cancelled by user");
    const uiExchangeStart = jest.fn().mockImplementation(({ onCancel }) => {
      onCancel(error);
    });
    const deps = makeHandlerDeps({ uiExchangeStart });
    mockedStartExchangeLogic.mockImplementation((_ctx, exchangeType, uiNavigation) =>
      uiNavigation(exchangeType),
    );

    const handler = createExchangeStartHandler(getDepsFrom(deps));

    await expect(handler({ exchangeType: "SWAP" })).rejects.toBe(error);
    expect(deps.tracking.completeExchangeFail).toHaveBeenCalledTimes(1);
    expect(deps.tracking.startExchangeSuccess).not.toHaveBeenCalled();
  });
});

describe("createExchangeCompleteHandler", () => {
  const swapParams: CompleteParams = {
    exchangeType: "SWAP",
    provider: "provider",
    fromAccountId: "from-id",
    toAccountId: "to-id",
    transaction,
    binaryPayload: Buffer.from("payload"),
    signature: Buffer.from("sig"),
    feeStrategy: "MEDIUM",
    swapId: "swap-1",
    rate: 1.5,
    tokenCurrency: "ethereum/erc20/usd_tether__erc20_",
  };

  const sellParams: CompleteParams = {
    exchangeType: "SELL",
    provider: "provider",
    fromAccountId: "from-id",
    transaction,
    binaryPayload: Buffer.from("payload"),
    signature: Buffer.from("sig"),
    feeStrategy: "MEDIUM",
    tokenCurrency: "ethereum/erc20/usd_tether__erc20_",
  };

  it("throws when the UI handler is not configured", () => {
    const deps = makeHandlerDeps({ uiExchangeComplete: undefined });
    const handler = createExchangeCompleteHandler(getDepsFrom(deps));

    expect(() => handler(swapParams)).toThrow("exchange.complete UI handler not configured");
  });

  it("resolves with the hash and tracks success on the UI success callback", async () => {
    const uiExchangeComplete = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess("0xhash");
    });
    const deps = makeHandlerDeps({ uiExchangeComplete });
    mockedCompleteExchangeLogic.mockImplementation(passThroughUi);

    const handler = createExchangeCompleteHandler(getDepsFrom(deps));
    const result = await handler(swapParams);

    expect(result).toBe("0xhash");
    expect(deps.tracking.completeExchangeSuccess).toHaveBeenCalledTimes(1);
  });

  it("rejects with the error passed to onCancel and tracks failure", async () => {
    const error = new Error("complete cancelled");
    const uiExchangeComplete = jest.fn().mockImplementation(({ onCancel }) => {
      onCancel(error);
    });
    const deps = makeHandlerDeps({ uiExchangeComplete });
    mockedCompleteExchangeLogic.mockImplementation(passThroughUi);

    const handler = createExchangeCompleteHandler(getDepsFrom(deps));

    await expect(handler(swapParams)).rejects.toBe(error);
    expect(deps.tracking.completeExchangeFail).toHaveBeenCalledTimes(1);
  });

  it("builds a SWAP request with swap fields and tokenCurrency", async () => {
    const uiExchangeComplete = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess("0xhash");
    });
    const deps = makeHandlerDeps({ uiExchangeComplete });
    mockedCompleteExchangeLogic.mockImplementation(passThroughUi);

    const handler = createExchangeCompleteHandler(getDepsFrom(deps));
    await handler(swapParams);

    const request = mockedCompleteExchangeLogic.mock.calls[0][1];
    expect(request).toMatchObject({
      provider: "provider",
      toAccountId: "to-id",
      swapId: "swap-1",
      rate: 1.5,
      exchangeType: ExchangeType.SWAP,
      tokenCurrency: "ethereum/erc20/usd_tether__erc20_",
    });
  });

  it("omits tokenCurrency, swap fields for a SELL request", async () => {
    const uiExchangeComplete = jest.fn().mockImplementation(({ onSuccess }) => {
      onSuccess("0xhash");
    });
    const deps = makeHandlerDeps({ uiExchangeComplete });
    mockedCompleteExchangeLogic.mockImplementation(passThroughUi);

    const handler = createExchangeCompleteHandler(getDepsFrom(deps));
    await handler(sellParams);

    const request = mockedCompleteExchangeLogic.mock.calls[0][1];
    expect(request.tokenCurrency).toBeUndefined();
    expect(request.toAccountId).toBeUndefined();
    expect(request.swapId).toBeUndefined();
    expect(request.rate).toBeUndefined();
    expect(request.exchangeType).toBe(ExchangeType.SELL);
  });
});
