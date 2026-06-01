import { webviewDriver, WebviewDriverOpPayload } from "../../mobile/bridge/server";

// Budget the in-WebView poll loops run for. The host waits a little longer so
// the driver can surface its own (more descriptive) timeout error first.
const POLL_TIMEOUT_MS = 60_000;
const HOST_TIMEOUT_MS = POLL_TIMEOUT_MS + 5_000;

// Host-side cadence for non-throwing "did this element show up?" probes.
const EXISTENCE_POLL_INTERVAL_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

  /** Resolve true when at least one element currently matches the testId. */
  async testIdExists(testId: string): Promise<boolean> {
    const matches = await this.querySelectorAllText(`[data-testid="${testId}"]`);
    return matches.length > 0;
  }

  async waitForTestIdToAppear(testId: string, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (await this.testIdExists(testId)) return true;
      if (Date.now() >= deadline) return false;
      await sleep(EXISTENCE_POLL_INTERVAL_MS);
    }
  }

  private async run<T = void>(op: WebviewDriverOpPayload): Promise<T> {
    const result = await webviewDriver(this.driver, op, HOST_TIMEOUT_MS);
    if (!result.ok) {
      throw new WebViewDriverError(result.error);
    }
    return result.data as T;
  }
}
