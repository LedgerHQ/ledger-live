import { setEnv } from "@shared/env";
import {
  configureMockServerTransport,
  getMockScriptRunnerBaseUrl,
} from "@ledgerhq/live-dmk-mobile";

/** Must run before the DMK is first built: the mock server transport is only added at build time. */
export function applyMockServerConfig({ url, token }: { url: string; token: string }) {
  configureMockServerTransport({ url, token });
  const scriptRunnerUrl = getMockScriptRunnerBaseUrl(url, token);
  if (scriptRunnerUrl) {
    setEnv("BASE_SOCKET_URL", scriptRunnerUrl);
  }
}
