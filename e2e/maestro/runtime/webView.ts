import { webviewDriver, WebviewDriverOpPayload } from "../../mobile/bridge/server";
import { allureStep } from "./allure";

function describeWebviewOp(op: WebviewDriverOpPayload): string {
  const target = "testId" in op ? op.testId : "selector" in op ? op.selector : undefined;
  return target ? `${op.op} (${target})` : op.op;
}

// Budget the in-WebView poll loops run for. The host waits a little longer so
// the driver can surface its own (more descriptive) timeout error first.
const POLL_TIMEOUT_MS = 60_000;
const HOST_TIMEOUT_MS = POLL_TIMEOUT_MS + 5_000;

export class WebViewDriverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebViewDriverError";
  }
}

export class WebViewHelper {
  constructor(private readonly driver: string) {}

  async tapByTestId(testId: string): Promise<void> {
    await this.waitForTestId(testId);
    await this.run({ op: "tapByTestId", testId });
  }

  tapByTestIdWhenEnabled(testId: string): Promise<void> {
    return this.run({ op: "tapByTestIdWhenEnabled", testId, timeoutMs: POLL_TIMEOUT_MS });
  }

  waitForTestId(testId: string): Promise<void> {
    return this.run({ op: "waitForTestId", testId, timeoutMs: POLL_TIMEOUT_MS });
  }

  waitForTestIdText(testId: string, text: string): Promise<void> {
    return this.run({ op: "waitForTestIdText", testId, text, timeoutMs: POLL_TIMEOUT_MS });
  }

  /** Wait until the (digit-parsed) text of an element is at least `min`. */
  waitForTestIdNumberAtLeast(testId: string, min: number): Promise<void> {
    return this.run({ op: "waitForTestIdNumberAtLeast", testId, min, timeoutMs: POLL_TIMEOUT_MS });
  }

  waitForTestIdNumberInRange(testId: string, min: number, max: number): Promise<void> {
    return this.run({
      op: "waitForTestIdNumberInRange",
      testId,
      min,
      max,
      timeoutMs: POLL_TIMEOUT_MS,
    });
  }

  waitForSelectorMatches(selector: string, pattern: string, flags?: string): Promise<string> {
    return this.run<string>({
      op: "waitForSelectorMatches",
      selector,
      pattern,
      flags,
      timeoutMs: POLL_TIMEOUT_MS,
    });
  }

  waitForSelectorTextsMatchingCount(countTestId: string, selector: string): Promise<string[]> {
    return this.run<string[]>({
      op: "waitForSelectorTextsMatchingCount",
      countTestId,
      selector,
      timeoutMs: POLL_TIMEOUT_MS,
    });
  }

  async getText(testId: string): Promise<string> {
    await this.waitForTestId(testId);
    return this.run<string>({ op: "getText", testId });
  }

  async typeText(testId: string, value: string): Promise<void> {
    await this.waitForTestId(testId);
    await this.run({ op: "typeText", testId, value });
  }

  querySelectorAllText(selector: string): Promise<string[]> {
    return this.run<string[]>({ op: "querySelectorAllText", selector });
  }

  private run<T = void>(op: WebviewDriverOpPayload): Promise<T> {
    return allureStep(`webview: ${describeWebviewOp(op)}`, async () => {
      const result = await webviewDriver(this.driver, op, HOST_TIMEOUT_MS);
      if (!result.ok) {
        throw new WebViewDriverError(result.error);
      }
      return result.data as T;
    });
  }
}
