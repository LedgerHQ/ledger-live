import {
  createMockConfidentialApi,
  type MockConfidentialApi,
  type SignTypedData,
} from "@ledgerhq/coin-evm/confidential";

export const confidentialApi: MockConfidentialApi = createMockConfidentialApi();

export const confidentialContext = {} as Parameters<MockConfidentialApi["getConfidentialPair"]>[0];

const MOCK_SIGNATURE_DELAY_MS = 1500;
const MOCK_SIGNATURE = `0x${"00".repeat(65)}` as const;

export class DeviceRefusedError extends Error {
  override name = "DeviceRefusedError";
}

let shouldRefuseNextSignature = false;

export const mockSignTypedData: SignTypedData = async () => {
  await new Promise(resolve => setTimeout(resolve, MOCK_SIGNATURE_DELAY_MS));
  if (shouldRefuseNextSignature) {
    shouldRefuseNextSignature = false;
    throw new DeviceRefusedError();
  }
  return MOCK_SIGNATURE;
};

export const mockControls = {
  failNext: confidentialApi.failNext,
  refuseNextSignature: () => {
    shouldRefuseNextSignature = true;
  },
};

if (typeof window !== "undefined" && typeof __DEV__ !== "undefined" && __DEV__) {
  Object.assign(window, { __confidentialMock: mockControls });
}
