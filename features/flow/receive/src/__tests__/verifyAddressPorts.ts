import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { VerifyAddressExecutorPorts, VerifyAddressSelection } from "../types";

export const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
export const ACCOUNT = { currency: { id: "ethereum", ticker: "ETH" } };
export const TOKEN = { ticker: "USDT" };
export const ACCOUNT_UUID = AccountUUIDSchema.parse("0fd543d7-5125-5f32-95c7-937d6a169ed4");

export const SELECTION: VerifyAddressSelection = {
  accountUUID: ACCOUNT_UUID,
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  verification: mockAccountReceive({ address: ADDRESS }).verification!,
};

export const GET_APP_AND_VERSION_APDU = new Uint8Array([0xb0, 0x01, 0x00, 0x00, 0x00]);
export const GET_ADDRESS_APDU = new Uint8Array([0xe0, 0x02, 0x01, 0x00, 0x00]);

/** A device that answers every APDU, recording what reaches it. */
export function fakeDevice() {
  const sendApdu = jest.fn(async (_args: { sessionId: string; apdu: Uint8Array }) => ({
    data: new Uint8Array(),
    statusCode: new Uint8Array([0x90, 0x00]),
  }));
  const dmk = { sendApdu } as unknown as DeviceManagementKit;
  const connection = { dmk, sessionId: "session-1" } as unknown as DeviceConnectionResult;

  return { sendApdu, connection };
}

export function fakePorts(
  overrides: Partial<
    VerifyAddressExecutorPorts<typeof ACCOUNT, typeof TOKEN, { path: string }, { appName: string }>
  > = {},
) {
  return {
    getAccount: jest.fn(() => ACCOUNT),
    findToken: jest.fn(async () => TOKEN),
    getAddressOptions: jest.fn(async () => ({ path: "44'/60'/0'/0/0" })),
    getAddress: jest.fn(async () => ({ address: ADDRESS })),
    buildInitializationInput: jest.fn(async () => ({ appName: "Ethereum" })),
    intentComponent: () => null,
    ...overrides,
  };
}
