import { selectWalletSyncState } from "@domain/entity-wallet-sync";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  createQRCodeCandidateInstance,
  createQRCodeHostInstance,
} from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import { resetTrustchainStore, setTrustchain } from "@ledgerhq/ledger-key-ring-protocol/store";
import { configureStore, type UnknownAction } from "@reduxjs/toolkit";
import { CloudSyncSDK } from "@shared/cloud-sync";
import { getCloudSyncSdk, getLkrpQrCode, getLkrpSdk } from "../middleware";
import { ledgerSyncReducer } from "../watch";
import {
  ACTIVATED,
  applyLocalState,
  blacklist,
  createStore,
  createWalletsync,
  holdNextResolution,
  isMockEnv,
  LKRP_URL,
  memberCredentials,
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
    const store = createStore(ACTIVATED);
    getCloudSyncSdk(store.dispatch);
    const { saveNewUpdate } = jest.mocked(CloudSyncSDK).mock.calls[0][0];
    const event = { type: "new-data" as const, data: { value: "distant" }, version: 1 };

    await saveNewUpdate(event, trustchain);
    await saveNewUpdate(event, trustchain);
    store.dispatch(blacklist(["token"]));
    await saveNewUpdate(event, trustchain);

    expect(createWalletsync.mock.calls).toEqual([[[]], [["token"]]]);
    expect(selectWalletSyncState(store.getState())).toEqual({
      data: { value: "distant" },
      version: 1,
    });
  });

  it.each<[string, UnknownAction]>([
    ["a reset", resetTrustchainStore()],
    ["a new pairing", setTrustchain({ ...trustchain, rootId: "paired-root-id" })],
    ["a key rotation", setTrustchain({ ...trustchain, applicationPath: "m/0'/16'/1'" })],
    ["a token blacklist change", blacklist(["token"])],
  ])("should drop an update whose resolution settles after %s", async (_, action) => {
    const store = createStore(ACTIVATED);
    getCloudSyncSdk(store.dispatch);
    const { saveNewUpdate } = jest.mocked(CloudSyncSDK).mock.calls[0][0];
    const resolution = holdNextResolution();

    const saving = saveNewUpdate(
      { type: "new-data", data: { value: "distant" }, version: 1 },
      trustchain,
    );
    store.dispatch(action);
    resolution.settle({ hasChanges: true, update: { newValue: "distant" } });
    await saving;

    expect(selectWalletSyncState(store.getState())).toEqual({ data: null, version: 0 });
    expect(applyLocalState).not.toHaveBeenCalled();
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
