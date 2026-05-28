import { webviewDriver, WebviewDriverOpPayload } from "../../mobile/bridge/server";

const DEFAULT_TIMEOUT_MS = 30_000;

export class WebViewDriverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebViewDriverError";
  }
}

async function execute<T = unknown>(
  driver: string,
  op: WebviewDriverOpPayload,
  timeoutMs: number,
): Promise<T> {
  const result = await webviewDriver(driver, op, timeoutMs);
  if (!result.ok) {
    throw new WebViewDriverError(result.error);
  }
  return result.data as T;
}

export class WebViewHelper {
  /**
   * @param driver Logical name of the registered WebView. Defaults to the
   *               swap live-app manifest id; pass another value when driving
   *               other live apps from a single test.
   */
  constructor(private readonly driver: string = "swap-live-app-stg-aws") {}

  async tapByTestId(testId: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    await this.waitForTestId(testId, timeoutMs);
    await execute(this.driver, { op: "tapByTestId", testId }, timeoutMs);
  }

  async waitForTestId(testId: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    await execute(this.driver, { op: "waitForTestId", testId, timeoutMs }, timeoutMs + 5_000);
  }

  async getText(testId: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<string> {
    await this.waitForTestId(testId, timeoutMs);
    return await execute<string>(this.driver, { op: "getText", testId }, timeoutMs);
  }

  async typeText(
    testId: string,
    value: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<void> {
    await this.waitForTestId(testId, timeoutMs);
    await execute(this.driver, { op: "typeText", testId, value }, timeoutMs);
  }

  async querySelectorAllText(
    selector: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string[]> {
    return await execute<string[]>(
      this.driver,
      { op: "querySelectorAllText", selector },
      timeoutMs,
    );
  }
}
