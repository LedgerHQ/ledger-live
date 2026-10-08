import { ConfidentialError } from "@ledgerhq/coin-evm/confidential";
import { consumeMockRefusal, DeviceRefusedError, type ConfidentialApi } from "./confidentialApi";
import { isRealConfidentialApi } from "./confidentialRuntime";

export type ShieldStep = "approve" | "wrap";

export type ShieldTransaction = Awaited<
  ReturnType<ConfidentialApi["prepareShield"]>
>["transactions"][number];

export type ShieldExecutor = {
  signAndBroadcast: (step: ShieldStep, transaction: ShieldTransaction) => Promise<string>;
  waitForConfirmation: (hash: string) => Promise<void>;
};

const MOCK_SIGNATURE_DELAY_MS = 1500;
const MOCK_CONFIRMATION_DELAY_MS = 2000;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const mockTransactionHash = () =>
  `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

export const mockShieldExecutor: ShieldExecutor = {
  signAndBroadcast: async () => {
    await wait(MOCK_SIGNATURE_DELAY_MS);
    if (consumeMockRefusal()) throw new DeviceRefusedError();
    return mockTransactionHash();
  },
  waitForConfirmation: () => wait(MOCK_CONFIRMATION_DELAY_MS),
};

const notWiredYet: ShieldExecutor = {
  signAndBroadcast: async () => {
    throw new ConfidentialError("Unavailable", "shield signing is not wired yet");
  },
  waitForConfirmation: async () => {
    throw new ConfidentialError("Unavailable", "shield signing is not wired yet");
  },
};

export const getShieldExecutor = (): ShieldExecutor =>
  isRealConfidentialApi() ? notWiredYet : mockShieldExecutor;
