import type { MockServerConnectionStatus } from "@ledgerhq/live-dmk-shared";

export type { MockServerConfig } from "@ledgerhq/live-dmk-shared";

export type MockServerStatus = "checking" | MockServerConnectionStatus;
