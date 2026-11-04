import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  createQRCodeCandidateInstance,
  createQRCodeHostInstance,
} from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import { configureStore } from "@reduxjs/toolkit";
import { CloudSyncSDK } from "@shared/cloud-sync";
import { getCloudSyncSdk, getLkrpQrCode, getLkrpSdk } from "../middleware";
import { ledgerSyncReducer } from "../watch";
import {
  blacklist,
  createStore,
  createWalletsync,
  isMockEnv,
  LKRP_URL,
  memberCredentials,
  save,
  trustchain,
} from "./ledgerSyncFixtures";

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  getSdk: jest.fn(() => ({ addMember: jest.fn() })),
}));
jest.mock("@ledgerhq/ledger-key-ring-protocol/qrcode/index", () => ({
  createQRCodeHostInstance: jest.fn(),
  createQRCodeCandidateInstance: jest.fn(),
}));
jest.mock("@shared/cloud-sync", () => ({
  ...jest.requireActual<typeof import("@shared/cloud-sync")>("@shared/cloud-sync"),
  CloudSyncSDK: jest.fn(() => ({})),
}));

const member = { id: "member-id", name: "Other instance", permissions: 112 };

describe("createLedgerSyncMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isMockEnv.mockReturnValue(false);
  });

  it("should build the services on the first request, once per store", () => {
    const store = createStore();
    isMockEnv.mockReturnValue(true);
    expect(getSdk).not.toHaveBeenCalled();

    const lkrpSdk = getLkrpSdk(store.dispatch);

    expect(getLkrpSdk(store.dispatch)).toBe(lkrpSdk);
    expect(getLkrpSdk(createStore().dispatch)).not.toBe(lkrpSdk);
    expect(jest.mocked(getSdk).mock.calls[0][0]).toBe(true);
  });

  it("should hand the trustchain lifecycle to the SDK only to re-encrypt on rotation", () => {
    getLkrpSdk(createStore().dispatch);
    getLkrpSdk(createStore({ reencryptOnRotation: true }).dispatch);

    const lifecycles = jest.mocked(getSdk).mock.calls.map(([, , , lifecycle]) => lifecycle);
    expect(lifecycles).toEqual([undefined, { onTrustchainRotation: expect.any(Function) }]);
  });

  it("should save updates through the walletsync of the current token blacklist", async () => {
    const store = createStore();
    getCloudSyncSdk(store.dispatch);
    const { saveNewUpdate } = jest.mocked(CloudSyncSDK).mock.calls[0][0];
    const event = { type: "new-data" as const, data: { value: "distant" }, version: 1 };

    await saveNewUpdate(event);
    await saveNewUpdate(event);
    store.dispatch(blacklist(["token"]));
    await saveNewUpdate(event);

    expect(createWalletsync.mock.calls).toEqual([[[]], [["token"]]]);
    expect(save).toHaveBeenCalledWith({ value: "distant" }, 1, null, expect.any(Function));
  });

  it("should host a pairing as this instance, adding the other member to its trustchain", async () => {
    const store = createStore();

    await getLkrpQrCode(store.dispatch).host({
      trustchain,
      memberCredentials,
      onDisplayQRCode: jest.fn(),
      onDisplayDigits: jest.fn(),
    });
    const { addMember, ...options } = jest.mocked(createQRCodeHostInstance).mock.calls[0][0];

    expect(options).toMatchObject({ trustchainApiBaseUrl: LKRP_URL, memberName: "Test instance" });
    await expect(addMember(member)).resolves.toBe(trustchain);
    expect(getLkrpSdk(store.dispatch).addMember).toHaveBeenCalledWith(
      trustchain,
      memberCredentials,
      member,
    );
  });

  it("should add no member when joining a pairing without a trustchain", async () => {
    const store = createStore();

    await getLkrpQrCode(store.dispatch).join({
      trustchain: null,
      memberCredentials,
      scannedUrl: "https://scanned.example.com",
      onRequestQRCodeInput: jest.fn(),
    });
    const { addMember } = jest.mocked(createQRCodeCandidateInstance).mock.calls[0][0];

    await expect(addMember(member)).rejects.toMatchObject({ name: "NoTrustchainInitialized" });
    expect(getLkrpSdk(store.dispatch).addMember).not.toHaveBeenCalled();
  });

  it("should throw LedgerSyncMiddlewareMissingError when the store has no Ledger Sync middleware", () => {
    const store = configureStore({ reducer: { ledgerSync: ledgerSyncReducer } });

    expect(() => getLkrpSdk(store.dispatch)).toThrow(
      expect.objectContaining({ name: "LedgerSyncMiddlewareMissingError" }),
    );
  });
});
