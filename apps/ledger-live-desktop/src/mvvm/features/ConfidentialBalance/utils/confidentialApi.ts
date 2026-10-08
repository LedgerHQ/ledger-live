import * as coinEvmConfidential from "@ledgerhq/coin-evm/confidential";
import {
  ConfidentialError,
  createMockConfidentialApi,
  type MockConfidentialApi,
  type SignTypedData,
} from "@ledgerhq/coin-evm/confidential";
import { isRealConfidentialApi } from "./confidentialRuntime";

export type ConfidentialApi = Omit<MockConfidentialApi, "failNext">;

const CONFIDENTIAL_API_FUNCTIONS = [
  "getConfidentialPair",
  "getConfidentialBalance",
  "ensurePermit",
  "revealConfidentialBalance",
  "prepareConfidentialSend",
  "prepareShield",
  "prepareUnshield",
  "parseUnwrapRequested",
  "resumeUnshield",
  "prepareFinalizeUnshield",
] as const satisfies readonly (keyof ConfidentialApi)[];

const notExportedYet = (name: string) => () => {
  throw new ConfidentialError("Unavailable", `coin-evm does not export ${name} yet`);
};

export function realConfidentialApi(
  exported: Partial<ConfidentialApi> = coinEvmConfidential as Partial<ConfidentialApi>,
): ConfidentialApi {
  return Object.fromEntries(
    CONFIDENTIAL_API_FUNCTIONS.map(name => [name, exported[name] ?? notExportedYet(name)]),
  ) as ConfidentialApi;
}

const mockApi: MockConfidentialApi = createMockConfidentialApi();

export const confidentialApi: ConfidentialApi = isRealConfidentialApi()
  ? realConfidentialApi()
  : mockApi;

const MOCK_SIGNATURE_DELAY_MS = 1500;
const MOCK_SIGNATURE = `0x${"00".repeat(65)}` as const;

export class DeviceRefusedError extends Error {
  override name = "DeviceRefusedError";
}

let shouldRefuseNextSignature = false;

export function consumeMockRefusal(): boolean {
  const refused = shouldRefuseNextSignature;
  shouldRefuseNextSignature = false;
  return refused;
}

export const mockSignTypedData: SignTypedData = async () => {
  await new Promise(resolve => setTimeout(resolve, MOCK_SIGNATURE_DELAY_MS));
  if (consumeMockRefusal()) throw new DeviceRefusedError();
  return MOCK_SIGNATURE;
};

export const mockControls = {
  failNext: mockApi.failNext,
  refuseNextSignature: () => {
    shouldRefuseNextSignature = true;
  },
};

if (typeof window !== "undefined" && typeof __DEV__ !== "undefined" && __DEV__) {
  Object.assign(window, { __confidentialMock: mockControls });
}
