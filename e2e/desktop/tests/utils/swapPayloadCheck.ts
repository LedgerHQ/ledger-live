import BigNumber from "bignumber.js";
import { APIResponse, Page, Request, Route, test } from "@playwright/test";
import { getSwapProvider } from "@ledgerhq/live-common/exchange/providers/swap";
import {
  checkSwapPayload,
  swapPayloadFormatOf,
  type SwapPayloadCheckReport,
  type SwapPayloadIssue,
} from "@ledgerhq/hw-app-exchange";
import { SWAP_API_BASE } from "tests/utils/swapApiBase";

type CapturedSwapExchange = {
  request: {
    provider?: string;
    deviceTransactionId?: string;
    address?: string;
    refundAddress?: string;
    amountFromInSmallestDenomination?: string;
  };
  status?: number;
  response?: { binaryPayload?: string; signature?: string };
  networkError?: string;
};

type SwapPayloadCheckResult =
  | { status: "not-captured"; reason: string }
  | { status: "skipped"; provider?: string; reason: string }
  | {
      status: "checked";
      provider: string;
      format: "ng" | "legacy";
      report: SwapPayloadCheckReport;
    };

type SwapPayloadWatch = {
  calls: number;
  exchanges: CapturedSwapExchange[];
  onCapture?: () => void;
  stop: () => Promise<void>;
};

const SWAP_URL = `${SWAP_API_BASE}/swap`;
// The device step starts after the app got the `/swap` answer: only a call in flight is waited for.
const IN_FLIGHT_WAIT_MS = 2_000;
const HEX_ADDRESS = /^0x[0-9a-f]+$/i;

const activeWatches = new WeakMap<Page, SwapPayloadWatch>();
const ignoreClosedPage = () => {};

function attempt<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

const toAtomicAmount = (value: string): bigint | undefined => {
  const amount = new BigNumber(value);
  return amount.isFinite() && amount.isInteger() && amount.gte(0)
    ? BigInt(amount.toFixed(0))
    : undefined;
};

const isSuccess = ({ status, networkError }: CapturedSwapExchange) =>
  !networkError && status !== undefined && status >= 200 && status < 300;

const sameAddress = (expected: string, actual?: string) =>
  HEX_ADDRESS.test(expected)
    ? expected.toLowerCase() === actual?.toLowerCase()
    : expected === actual;

const addressIssues = (
  addresses: { field: string; expected?: string; actual?: string }[],
): SwapPayloadIssue[] =>
  addresses
    .filter(({ expected, actual }) => expected !== undefined && !sameAddress(expected, actual))
    .map(({ field, expected, actual }) => ({
      code: "EXPECTED_VALUE_MISMATCH",
      severity: "error",
      field,
      message: `Field "${field}" is "${actual ?? ""}", expected "${expected}".`,
    }));

const issueLabel = (issue: SwapPayloadIssue) =>
  issue.field ? `${issue.code} (${issue.field})` : issue.code;

const errorIssues = (report: SwapPayloadCheckReport) =>
  report.issues.filter(issue => issue.severity === "error");

/** Starts a pass-through watch of the app `/swap` call, replacing any previous watch of `page`. */
export async function startSwapPayloadWatch(page: Page): Promise<void> {
  await stopSwapPayloadWatch(page);
  const isSwapUrl = (url: URL) => `${url.origin}${url.pathname}` === SWAP_URL;
  const watch: SwapPayloadWatch = {
    calls: 0,
    exchanges: [],
    stop: () => page.unroute(isSwapUrl, handler).catch(ignoreClosedPage),
  };

  const capture = (exchange: CapturedSwapExchange) => {
    watch.exchanges.push(exchange);
    watch.onCapture?.();
  };

  async function handler(route: Route, request: Request) {
    if (request.method() !== "POST") return route.fallback();
    watch.calls += 1;
    const swapRequest = attempt(() => JSON.parse(request.postData() ?? "")) ?? {};
    let response: APIResponse;
    try {
      // The app has no timeout on this call, the watch must not cut a slow answer.
      response = await route.fetch({ timeout: 0 });
    } catch (error) {
      capture({ request: swapRequest, networkError: String(error) });
      // Abort, never continue: continuing would send the POST a second time.
      return route.abort("failed").catch(ignoreClosedPage);
    }
    const body = await response.text().catch(() => "");
    capture({
      request: swapRequest,
      status: response.status(),
      response: attempt(() => JSON.parse(body)),
    });
    await route.fulfill({ response }).catch(ignoreClosedPage);
  }

  await page.route(isSwapUrl, handler);
  activeWatches.set(page, watch);
}

export async function stopSwapPayloadWatch(page: Page): Promise<void> {
  const watch = activeWatches.get(page);
  activeWatches.delete(page);
  await watch?.stop();
}

async function checkCapturedSwapPayload({
  request,
  response,
  status,
  networkError,
}: CapturedSwapExchange): Promise<SwapPayloadCheckResult> {
  const { provider, amountFromInSmallestDenomination: amount } = request;
  const skipped = (reason: string) => ({ status: "skipped" as const, provider, reason });
  if (networkError) return skipped(`Swap call failed: ${networkError}`);
  if (!isSuccess({ request, status })) return skipped(`Swap backend answered HTTP ${status}`);
  if (!provider) return skipped("Swap request has no provider");

  let config: Awaited<ReturnType<typeof getSwapProvider>>;
  try {
    config = await getSwapProvider(provider);
  } catch (error) {
    return skipped(`Provider config lookup failed: ${String(error)}`);
  }
  if (config.type !== "CEX") return skipped(`${config.type} provider, no partner payload`);
  const partnerPublicKey = config.publicKey;
  if (!partnerPublicKey) return skipped("CEX provider config has no partner public key");

  const amountToProvider = amount === undefined ? undefined : toAtomicAmount(amount);
  const amountIssues: SwapPayloadIssue[] =
    amount !== undefined && amountToProvider === undefined
      ? [
          {
            code: "EXPECTED_VALUE_MISMATCH",
            severity: "error",
            field: "amount_to_provider",
            message: `Swap request amount "${amount}" is not a non-negative integer.`,
          },
        ]
      : [];

  const format = swapPayloadFormatOf(config.version);
  const libraryReport = checkSwapPayload({
    payload: response?.binaryPayload ?? "",
    signature: response?.signature ?? "",
    partnerPublicKey,
    format,
    expected: {
      deviceTransactionId: request.deviceTransactionId,
      amountToProvider,
    },
  });
  const { decoded } = libraryReport;
  const mismatches = [
    ...amountIssues,
    ...(decoded
      ? addressIssues([
          { field: "payout_address", expected: request.address, actual: decoded.payoutAddress },
          {
            field: "refund_address",
            expected: request.refundAddress,
            actual: decoded.refundAddress,
          },
        ])
      : []),
  ];
  const report = {
    ...libraryReport,
    valid: libraryReport.valid && mismatches.length === 0,
    issues: [...libraryReport.issues, ...mismatches],
  };
  return { status: "checked", provider, format, report };
}

const allCallsCaptured = (watch: SwapPayloadWatch) => watch.exchanges.length >= watch.calls;

function waitForInFlightCalls(watch: SwapPayloadWatch): Promise<void> {
  if (allCallsCaptured(watch)) return Promise.resolve();
  return new Promise(resolve => {
    const timer = setTimeout(finish, IN_FLIGHT_WAIT_MS);
    function finish() {
      clearTimeout(timer);
      watch.onCapture = undefined;
      resolve();
    }
    watch.onCapture = () => {
      if (allCallsCaptured(watch)) finish();
    };
  });
}

async function checkAndAttach(watch: SwapPayloadWatch): Promise<SwapPayloadCheckResult> {
  await waitForInFlightCalls(watch);

  const exchange = watch.exchanges.findLast(isSuccess) ?? watch.exchanges.at(-1);
  const result: SwapPayloadCheckResult = exchange
    ? await checkCapturedSwapPayload(exchange)
    : {
        status: "not-captured",
        reason: watch.calls
          ? `POST ${SWAP_URL} still pending after ${IN_FLIGHT_WAIT_MS}ms`
          : `No POST ${SWAP_URL} during this swap (e.g. DEX providers do not call it)`,
      };

  await test.info().attach("Swap payload check", {
    body: JSON.stringify(
      { swapCalls: watch.calls, ...result },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
      2,
    ),
    contentType: "application/json",
  });
  return result;
}

async function annotateDeviceFailure(watch: SwapPayloadWatch, error: unknown): Promise<never> {
  const check = await checkAndAttach(watch).catch(() => undefined);
  if (check?.status === "checked" && !check.report.valid && error instanceof Error) {
    const codes = errorIssues(check.report).map(issueLabel).join(", ");
    error.message += `\n↳ Invalid swap partner payload: ${codes}`;
  }
  throw error;
}

/**
 * Runs a swap device step, then fails the test when the payload captured since
 * `SwapPage.clickExchangeButton` is invalid. When the device step itself fails, its error is
 * rethrown with the payload issue codes appended.
 */
export async function withSwapPayloadCheck<T>(
  page: Page,
  deviceStep: () => Promise<T>,
): Promise<T> {
  const watch = activeWatches.get(page);
  if (!watch) return deviceStep();

  try {
    const result = await deviceStep().catch((error: unknown) =>
      annotateDeviceFailure(watch, error),
    );

    const check = await checkAndAttach(watch);
    if (check.status === "checked" && !check.report.valid) {
      const errors = errorIssues(check.report).map(i => `- ${issueLabel(i)}: ${i.message}`);
      const header = `Invalid swap partner payload from provider "${check.provider}":`;
      throw new Error([header, ...errors].join("\n"));
    }
    return result;
  } finally {
    await stopSwapPayloadWatch(page);
  }
}
