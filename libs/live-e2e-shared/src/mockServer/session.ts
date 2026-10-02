import { DmkNetworkClient } from "@ledgerhq/device-management-kit";
import {
  MockClient,
  type Device,
  type DeviceConfig,
  type MockConfig,
  type SpeculosButton,
} from "@ledgerhq/device-mockserver-client";

import {
  GET_VERSION_APDU,
  GET_VERSION_PREFIX,
  withCharonState,
  withOnboardingFlags,
} from "./onboardingFlags";

const REQUEST_TIMEOUT_MS = 10_000;
const PROMPT_POLL_MS = 500;
const STUCK_BUTTON_SCREEN_MS = 2_000;

type ScreenEvent = Readonly<{ text: string; x: number; y: number }>;

type PromptProgress = {
  lastScreen: string;
  latestText: string;
  lastAdvancedAt: number;
};

const APPROVAL_LABEL = /^(confirm|approve|accept|continue)\b/i;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isIdleScreen = (text: string) => text.trim() === "" || /is ready/i.test(text);

const isApproval = (text: string) => APPROVAL_LABEL.test(text.trim());

/** Status the device shows after the host already has the result. It lingers until a button or its timer. */
const isCompletionStatus = (text: string) =>
  /saved\s+to\s+your\s+contacts|contact\s+name\s+changed|error\s+during|canceled/i.test(text);

const TOUCH_DEVICE_TYPES = new Set(["stax", "flex", "europa", "apex", "apexp", "nanoGen5"]);

const isTouchModel = (deviceType: string) => TOUCH_DEVICE_TYPES.has(deviceType);

const screenText = (events: ScreenEvent[]) => events.map(event => event.text).join(" ");

const isStuckOnScreen = (text: string, progress: PromptProgress) =>
  text === progress.lastScreen &&
  progress.lastAdvancedAt > 0 &&
  Date.now() - progress.lastAdvancedAt >= STUCK_BUTTON_SCREEN_MS;

/** Matches the `MOCK_SERVER_TRANSPORT_URL` env default. */
const DEFAULT_MOCK_SERVER_URL = "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";
const REACHABILITY_TIMEOUT_MS = 5_000;

const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

export const mockServerBaseUrl = (): string =>
  stripTrailingSlashes(process.env.MOCK_SERVER_TRANSPORT_URL || DEFAULT_MOCK_SERVER_URL);

/** `MockClient` never forwards a request timeout, so one is applied to the fetch under it. */
const timeoutAfter =
  (timeoutMs: number): typeof fetch =>
  (input: string | URL | Request, init?: RequestInit) =>
    fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });

/** Creates a session and imports `devices`. The caller owns the token and passes it to the app. */
const mockServerClient = (baseUrl: string, token?: string) =>
  new MockClient(baseUrl, {
    token,
    httpClient: new DmkNetworkClient({ baseUrl, fetch: timeoutAfter(REQUEST_TIMEOUT_MS) }),
  });

export async function provisionMockServerSession(
  devices: DeviceConfig[],
): Promise<{ baseUrl: string; token: string }> {
  await assertMockServerReachable();
  const baseUrl = mockServerBaseUrl();
  const client = mockServerClient(baseUrl);
  const token = await client.authenticate();
  await client.importSession({ devices });
  return { baseUrl, token };
}

export async function disposeMockServerSession(baseUrl: string, token: string): Promise<void> {
  await mockServerClient(baseUrl, token).disposeSession();
}

export async function assertMockServerReachable(): Promise<void> {
  const baseUrl = mockServerBaseUrl();
  try {
    await new DmkNetworkClient({ baseUrl }).get("health", { timeoutMs: REACHABILITY_TIMEOUT_MS });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Mock server unreachable at ${baseUrl} (${reason}).`);
  }
}

/**
 * A handle on the mock server session the app provisioned at boot, so a test can keep
 * editing the device — swapping APDU mocks mid-flow to drive it where it needs to go.
 * The token is read back from the running app.
 */
export class MockServerSessionHandle {
  private readonly client: MockClient;
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.client = new MockClient(baseUrl, {
      token,
      httpClient: new DmkNetworkClient({ baseUrl, fetch: timeoutAfter(REQUEST_TIMEOUT_MS) }),
    });
  }

  /** Apps the device reports as installed, which is not what the install UI shows. */
  async installedApps(): Promise<string[]> {
    const { apps = [] } = await this.firstDevice();
    return apps.map(({ name }) => name);
  }

  /**
   * Freezes the device on an onboarding step by pinning GET_VERSION. Only the flag bytes
   * are rewritten — the rest of the reply is whatever the device actually returned, so
   * this needs no per-model frame and survives firmware changes.
   *
   * Drive it onwards with another step rather than releasing the mock: released, the
   * device resumes from where it was and has to re-traverse the steps.
   */
  async pinOnboardingStep(step: number, onboarded = false, charonStatus?: number): Promise<void> {
    const { id } = await this.firstDevice();
    const { response } = await this.client.sendApdu(id, GET_VERSION_APDU);

    const flagged = withOnboardingFlags(response, step, onboarded);

    await this.pinApdu(id, {
      prefix: GET_VERSION_PREFIX,
      responses: [charonStatus === undefined ? flagged : withCharonState(flagged, charonStatus)],
    });
  }

  /** Language pack the device runs, `undefined` while it runs its built-in English. */
  async deviceLanguage(): Promise<string | undefined> {
    const { language } = await this.firstDevice();
    return language;
  }

  /**
   * Pages the live Speculos screen until `isDone`. Screen text is read through the mock
   * server's Speculos proxy, so the test does not need to reach the emulator pod.
   * A missing proxy (dashboard, no coin app) is a wait, not a failure: the OS layer
   * answers those APDUs itself.
   */
  async approvePromptsUntil(isDone: () => Promise<boolean>, timeoutMs = 120_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    const progress: PromptProgress = { lastScreen: "", latestText: "", lastAdvancedAt: 0 };

    while (Date.now() < deadline) {
      const finished = await this.advancePromptOnce(isDone, progress);
      if (finished) return;
    }

    const lastScreen = progress.latestText || progress.lastScreen || "none";
    throw new Error(`Timed out approving the device prompt. Last screen: "${lastScreen}"`);
  }

  /**
   * Clears a success status left on screen after the intent dialog has already closed.
   * The next device action cannot draw its review until that status is gone.
   */
  async dismissCompletionStatus(timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastDismissedAt = 0;

    while (Date.now() < deadline) {
      const dismissedAt = await this.dismissLingeringStatus(lastDismissedAt);
      if (dismissedAt === undefined) return;
      lastDismissedAt = dismissedAt;
    }
  }

  private async advancePromptOnce(
    isDone: () => Promise<boolean>,
    progress: PromptProgress,
  ): Promise<boolean> {
    if (await isDone()) return true;

    const events = await this.screenEvents();
    if (events) {
      await this.reactToPrompt(events, progress);
    }
    await sleep(PROMPT_POLL_MS);
    return false;
  }

  private async reactToPrompt(events: ScreenEvent[], progress: PromptProgress): Promise<void> {
    const text = screenText(events);
    progress.latestText = text;

    if (isCompletionStatus(text)) {
      progress.lastAdvancedAt = await this.dismissWhenDue(events, progress.lastAdvancedAt);
      return;
    }

    if (isIdleScreen(text)) return;

    const stuckOnButtonScreen = isStuckOnScreen(text, progress);
    if (text === progress.lastScreen && !stuckOnButtonScreen) return;

    progress.lastScreen = text;
    await this.advanceScreen(events, stuckOnButtonScreen);
    progress.lastAdvancedAt = Date.now();
  }

  private async dismissWhenDue(events: ScreenEvent[], lastDismissedAt: number): Promise<number> {
    if (Date.now() - lastDismissedAt < STUCK_BUTTON_SCREEN_MS) return lastDismissedAt;

    await this.dismissStatus(events);
    return Date.now();
  }

  private async dismissLingeringStatus(lastDismissedAt: number): Promise<number | undefined> {
    const events = await this.screenEvents();
    if (!events) return undefined;

    if (!isCompletionStatus(screenText(events))) return undefined;

    const dismissedAt = await this.dismissWhenDue(events, lastDismissedAt);
    await sleep(PROMPT_POLL_MS);
    return dismissedAt;
  }

  /**
   * Answers every APDU with this prefix from the mock table. An explicit mock wins over
   * the response the server would synthesize, including `6d00` for an instruction it
   * does not implement.
   */
  async pinApduResponse(prefix: string, response: string): Promise<void> {
    const { id } = await this.firstDevice();
    await this.pinApdu(id, { prefix, response });
  }

  /**
   * Edits the mock covering a prefix in place rather than clearing and re-adding it:
   * `addMock` does not replace a prefix it already holds, and dropping the mock first
   * leaves a window in which the emulated device answers.
   */
  private async pinApdu(deviceId: string, mock: MockConfig): Promise<void> {
    const existing = await this.client.listMocks(deviceId);
    const current = existing.find(({ prefix }) => prefix === mock.prefix);

    if (current) {
      await this.client.editMock(deviceId, current.id, mock);
    } else {
      await this.client.addMock(deviceId, mock);
    }
  }

  private async screenEvents(): Promise<ScreenEvent[] | null> {
    const { id } = await this.firstDevice();
    const response = await fetch(
      `${this.baseUrl}/devices/${id}/speculos/events?stream=false&currentscreenonly=true`,
      {
        headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (response.status === 409) return null;
    if (!response.ok) {
      throw new Error(`Mock server screen events failed (${response.status})`);
    }

    const body = (await response.json()) as {
      events?: { text?: string; x?: number; y?: number }[];
    };
    return (body.events ?? []).map(event => ({
      text: event.text ?? "",
      x: event.x ?? 0,
      y: event.y ?? 0,
    }));
  }

  private async dismissStatus(events: ScreenEvent[]): Promise<void> {
    const device = await this.firstDevice();
    if (isTouchModel(device.device_type)) {
      const target = events.find(event => event.x > 0 || event.y > 0);
      await this.client.touchScreen(
        device.id,
        target?.x ?? 200,
        target?.y ?? 300,
        "press-and-release",
      );
      return;
    }
    await this.client.pressButton(device.id, "right");
  }

  private async advanceScreen(events: ScreenEvent[], confirmStuckScreen: boolean): Promise<void> {
    const device = await this.firstDevice();
    const approval = events.find(event => isApproval(event.text));

    if (isTouchModel(device.device_type)) {
      if (confirmStuckScreen) return;
      if (!approval) {
        await this.pageTouchScreen(device.id);
        return;
      }
      await this.client.touchScreen(device.id, approval.x, approval.y, "press-and-release");
      return;
    }

    const button: SpeculosButton = approval || confirmStuckScreen ? "both" : "right";
    await this.client.pressButton(device.id, button);
  }

  private async pageTouchScreen(deviceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/speculos/finger`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "press-and-release",
        x: 100,
        y: 100,
        x2: 50,
        y2: 100,
        delay: 0.5,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 409) return;
    if (!response.ok) {
      throw new Error(`Mock server touch swipe failed (${response.status})`);
    }
  }

  private async firstDevice(): Promise<Device> {
    const [device] = await this.client.listDevices();
    if (!device) throw new Error("mock server session has no devices");
    return device;
  }
}
