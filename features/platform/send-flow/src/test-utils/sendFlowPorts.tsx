import React, { type ReactNode } from "react";
import {
  createSendFeatures,
  type GetSendDescriptor,
  type SendFeatures,
} from "../descriptor/features";
import type { SendFlowPorts } from "../ports/ports";
import { SendFlowPortsProvider } from "../ports/SendFlowPortsContext";

const noopSync = () => {};

export function createTestSendFlowPorts(
  overrides: Partial<SendFlowPorts> & { getSendDescriptor?: GetSendDescriptor } = {},
): SendFlowPorts {
  const { getSendDescriptor = () => null, ...ports } = overrides;
  return {
    sendFeatures: createSendFeatures(getSendDescriptor),
    getAccountBridge: jest.fn(() => Promise.reject(new Error("getAccountBridge not stubbed"))),
    applyMemoToTransaction: jest.fn(() => ({})),
    addRecentAddress: jest.fn(),
    useAccountSync: () => noopSync,
    getSponsoredCoinApi: jest.fn(() => Promise.resolve(null)),
    buildSponsoredIntent: jest.fn(() => Promise.resolve({})),
    ...ports,
  };
}

export function createSendFlowPortsWrapper(ports: SendFlowPorts) {
  return function SendFlowPortsTestWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <SendFlowPortsProvider ports={ports}>{children}</SendFlowPortsProvider>;
  };
}

/** Every accessor is a jest.fn running the real no-descriptor fallback until a test overrides it. */
export function createMockSendFeatures(
  getSendDescriptor: GetSendDescriptor = () => null,
): jest.Mocked<SendFeatures> {
  const features = createSendFeatures(getSendDescriptor);
  const mocked: Record<string, unknown> = {};
  for (const [key, fn] of Object.entries(features)) {
    const impl: (...args: never[]) => unknown = fn;
    mocked[key] = jest.fn(impl);
  }
  // oxlint-disable-next-line typescript/consistent-type-assertions
  return mocked as jest.Mocked<SendFeatures>;
}

/** A promise React `use()` reads synchronously, so hooks using the bridge render without suspending. */
export function fulfilledPromise<T>(value: T): Promise<T> {
  return Object.assign(Promise.resolve(value), { status: "fulfilled", value });
}
