import { firstValueFrom, lastValueFrom, toArray } from "rxjs";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@ledgerhq/device-intent";
import { submitRfqOrderEvmJob } from "./job";
import type {
  SubmitRfqOrderEvmIntentInput,
  SubmitRfqOrderEvmJobState,
} from "./types";

const FAKE_DEVICE_CONNECTION = {} as DeviceConnectionResult;
const FAKE_DEVICE_CONTEXT = {} as DeviceExtractedContext;

function makeFetch(responses: Array<{ status?: number; body: unknown }>) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  let idx = 0;
  const fetchImpl: typeof fetch = (input, init) => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    calls.push({ url, init });
    const entry = responses[idx++] ?? responses[responses.length - 1];
    const status = entry.status ?? 200;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "ERR",
      json: () => Promise.resolve(entry.body),
    } as unknown as Response);
  };
  return { fetchImpl, calls };
}

async function collectStates(
  input: SubmitRfqOrderEvmIntentInput,
): Promise<SubmitRfqOrderEvmJobState[]> {
  return lastValueFrom(
    submitRfqOrderEvmJob({
      deviceConnectionResult: FAKE_DEVICE_CONNECTION,
      deviceExtractedContext: FAKE_DEVICE_CONTEXT,
      input,
    }).pipe(toArray()),
  );
}

const BASE_INPUT: SubmitRfqOrderEvmIntentInput = {
  provider: "uniswap",
  submitBody: { signature: "0xsig" },
  network: "ethereum",
  swapApiBaseURL: "https://swap.test/v5",
  pollIntervalMs: 1,
  maxPollAttempts: 3,
};

describe("submitRfqOrderEvmJob", () => {
  it("posts to /<provider>/submit then to /swap/status and emits a confirmed state on `finished`", async () => {
    const { fetchImpl, calls } = makeFetch([
      { body: { uniswapOrderResponse: { orderId: "ord-1" } } },
      {
        body: [
          {
            status: "finished",
            txHash: "0xabc",
            swapId: "swap-1",
            finalAmount: "100",
          },
        ],
      },
    ]);
    const states = await collectStates({ ...BASE_INPUT, fetchImpl });

    expect(calls[0].url).toBe("https://swap.test/v5/uniswap/submit");
    expect(calls[1].url).toBe("https://swap.test/v5/swap/status");

    const terminal = states[states.length - 1];
    expect(terminal).toEqual({
      type: "confirmed",
      orderId: "ord-1",
      status: "finished",
      txHash: "0xabc",
      swapId: "swap-1",
      finalAmount: "100",
    });
  });

  it("resolves with a refunded status when the partner reports refunded", async () => {
    const { fetchImpl } = makeFetch([
      { body: { uniswapOrderResponse: { orderId: "ord-2" } } },
      { body: [{ status: "refunded" }] },
    ]);
    const states = await collectStates({ ...BASE_INPUT, fetchImpl });
    expect(states[states.length - 1]).toMatchObject({
      type: "confirmed",
      status: "refunded",
      orderId: "ord-2",
    });
  });

  it("prefers the precomputed order id over the submit response", async () => {
    const { fetchImpl, calls } = makeFetch([
      { body: {} },
      { body: [{ status: "finished" }] },
    ]);
    const states = await collectStates({
      ...BASE_INPUT,
      provider: "oneinchfusion",
      precomputedOrderId: "0xprecomputed",
      fetchImpl,
    });
    const terminal = states[states.length - 1];
    expect(terminal).toMatchObject({
      type: "confirmed",
      orderId: "0xprecomputed",
    });
    expect(calls[0].url).toBe("https://swap.test/v5/oneinchfusion/submit");
  });

  it("fails when the submit response omits the order id and none is precomputed", async () => {
    const { fetchImpl } = makeFetch([{ body: {} }]);
    const states = await collectStates({ ...BASE_INPUT, fetchImpl });
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toMatch(/order id/);
    }
  });

  it("fails when the submit endpoint returns a non-2xx status", async () => {
    const { fetchImpl } = makeFetch([{ status: 500, body: {} }]);
    const states = await collectStates({ ...BASE_INPUT, fetchImpl });
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toMatch(/HTTP 500/);
    }
  });

  it("fails after exceeding the polling attempt budget", async () => {
    const { fetchImpl } = makeFetch([
      { body: { uniswapOrderResponse: { orderId: "ord-3" } } },
      { body: [{ status: "pending" }] },
    ]);
    const states = await collectStates({
      ...BASE_INPUT,
      fetchImpl,
      maxPollAttempts: 2,
    });
    const terminal = states[states.length - 1];
    expect(terminal.type).toBe("failed");
    if (terminal.type === "failed") {
      expect(terminal.error.message).toMatch(/not resolve/);
    }
  });

  it("emits a synchronous `submitting` state before the first network call", async () => {
    const { fetchImpl } = makeFetch([
      { body: { uniswapOrderResponse: { orderId: "ord-4" } } },
      { body: [{ status: "finished" }] },
    ]);
    const first = await firstValueFrom(
      submitRfqOrderEvmJob({
        deviceConnectionResult: FAKE_DEVICE_CONNECTION,
        deviceExtractedContext: FAKE_DEVICE_CONTEXT,
        input: { ...BASE_INPUT, fetchImpl },
      }),
    );
    expect(first).toEqual({ type: "submitting" });
  });
});
