import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import { TrustchainResultType, type TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  createQRCodeCandidateInstance,
  createQRCodeHostInstance,
} from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import type { KeyRingState } from "@domain/entity-key-ring";
import { TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { lastValueFrom, of, type Observable } from "rxjs";
import { Permissions, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { KeyRingMemberKeyRecordSchema } from "@domain/entity-key-ring";
import { KeyRingMemberSchema } from "../../schema";
import {
  KeyRingNotAllowedError,
  KeyRingTreeNotFoundError,
  keyRingErrorForDisplay,
} from "../../errors";
import { memberKeyRecordOf, sessionOf, treeRecordOf } from "../handles";
import { createLifecycleHub } from "../lifecycleHub";
import { createV1Client } from "./client";
import { createSliceKeyStore, type V1KeyStore } from "./sliceKeyStore";

jest.mock("@ledgerhq/ledger-key-ring-protocol/qrcode/index", () => ({
  createQRCodeHostInstance: jest.fn(),
  createQRCodeCandidateInstance: jest.fn(),
}));

const STATE = mockKeyRingState();
const TREE = STATE.trustchain!;
const MEMBER_KEY = STATE.memberCredentials!;
const NEW_TREE = mockKeyRingTreeRecord({ applicationPath: "m/0'/16'/1'" });
const MEMBER = KeyRingMemberSchema.parse({ id: "other", name: "Other" });
const V1_MEMBER = { id: "other", name: "Other", permissions: 1 };

function notStubbed(): never {
  throw new Error("not stubbed");
}

function setup(
  stubs: Partial<TrustchainSDK> = {},
  state: KeyRingState = STATE,
  { mock = false, keyStore = createSliceKeyStore(() => state) }: SetupOptions = {},
) {
  const sdk: TrustchainSDK = {
    initMemberCredentials: notStubbed,
    getOrCreateTrustchain: notStubbed,
    restoreTrustchain: notStubbed,
    getMembers: notStubbed,
    removeMember: notStubbed,
    addMember: notStubbed,
    destroyTrustchain: notStubbed,
    destroyApplication: notStubbed,
    encryptUserData: notStubbed,
    decryptUserData: notStubbed,
    invalidateJwt: notStubbed,
    withAuth: notStubbed,
    ...stubs,
  };
  const hub = createLifecycleHub();
  const events = jest.fn();
  hub.subscribe(events);
  const createSdk = jest.fn((_deviceAccess: unknown) => sdk);
  const createSessionTransport = jest.fn(() => ({ transport: "session" }) as never);
  const client = createV1Client({
    mock,
    apiBaseUrl: "https://trustchain.test",
    keyStore,
    bridge: { withDevice: jest.fn(), createSessionTransport },
    hub,
    createSdk,
  });
  return { client, session: sessionOf(state), events, hub, createSdk, createSessionTransport };
}

type SetupOptions = Readonly<{ mock?: boolean; keyStore?: V1KeyStore }>;

describe("createV1Client", () => {
  it("activate runs getOrCreateTrustchain with the session and maps the outcome", async () => {
    const getOrCreateTrustchain = jest.fn(async () => ({
      type: TrustchainResultType.updated,
      trustchain: NEW_TREE,
    }));
    const { client, session } = setup({ getOrCreateTrustchain });
    const callbacks = { onStartRequestUserInteraction: jest.fn() };

    const activation = await client.activate(session, { legacyDeviceId: "device", callbacks });

    expect(getOrCreateTrustchain).toHaveBeenCalledWith(
      "device",
      MEMBER_KEY,
      callbacks,
      undefined,
      TREE,
    );
    expect(activation.outcome).toBe("joined");
    expect(treeRecordOf(activation.tree)).toBe(NEW_TREE);
  });

  it("activate without tree creation rejects a seed with no key tree", async () => {
    const getOrCreateTrustchain = jest.fn<
      ReturnType<TrustchainSDK["getOrCreateTrustchain"]>,
      Parameters<TrustchainSDK["getOrCreateTrustchain"]>
    >(async (_device, _key, callbacks) => {
      callbacks?.onInitialResponse?.({});
      return { type: TrustchainResultType.created, trustchain: NEW_TREE };
    });
    const { client, session } = setup(
      { getOrCreateTrustchain },
      mockKeyRingState({ trustchain: null }),
    );

    await expect(
      client.activate(session, { legacyDeviceId: "device", allowTreeCreation: false }),
    ).rejects.toMatchObject({ category: "no-tree-for-seed", message: "NoTrustchainInitialized" });
    expect(getOrCreateTrustchain.mock.calls[0][4]).toBeUndefined();
  });

  it("activate without tree creation still joins an existing key tree", async () => {
    const getOrCreateTrustchain = jest.fn<
      ReturnType<TrustchainSDK["getOrCreateTrustchain"]>,
      Parameters<TrustchainSDK["getOrCreateTrustchain"]>
    >(async (_device, _key, callbacks) => {
      callbacks?.onInitialResponse?.({ [TREE.rootId]: {} } as never);
      return { type: TrustchainResultType.restored, trustchain: TREE };
    });
    const { client, session } = setup({ getOrCreateTrustchain });

    const activation = await client.activate(session, {
      legacyDeviceId: "device",
      allowTreeCreation: false,
    });
    expect(activation.outcome).toBe("restored");
  });

  it("activate needs a member key", async () => {
    const { client, session } = setup({}, mockKeyRingState({ memberCredentials: null }));
    await expect(client.activate(session, { legacyDeviceId: "device" })).rejects.toThrow(
      "memberCredentials is not set",
    );
  });

  it("restore reloads the key tree", async () => {
    const restoreTrustchain = jest.fn(async () => NEW_TREE);
    const { client, session } = setup({ restoreTrustchain });
    expect(treeRecordOf(await client.restore(session))).toBe(NEW_TREE);
    expect(restoreTrustchain).toHaveBeenCalledWith(TREE, MEMBER_KEY);
  });

  it("listMembers lists the members without their v1 permissions", async () => {
    const getMembers = jest.fn(async () => [V1_MEMBER]);
    const { client, session } = setup({ getMembers });
    expect(await client.listMembers(session)).toEqual([MEMBER]);
    expect(getMembers).toHaveBeenCalledWith(TREE, MEMBER_KEY);
  });

  it("listMembers fails with tree-not-found without key tree, keeping the v1 error", async () => {
    const { client, session } = setup({}, mockKeyRingState({ trustchain: null }));
    const failure = await client.listMembers(session).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(KeyRingTreeNotFoundError);
    expect(failure).toMatchObject({ message: "TrustchainNotFound" });
    expect(keyRingErrorForDisplay(failure)).toMatchObject({ name: "TrustchainNotFound" });
  });

  it("removeMember hands the SDK the member it listed, permissions included", async () => {
    const removeMember = jest.fn(async () => NEW_TREE);
    const { client, session } = setup({
      getMembers: jest.fn(async () => [V1_MEMBER]),
      removeMember,
    });
    const [listed] = await client.listMembers(session);
    await client.removeMember(session, { legacyDeviceId: "device", member: listed });
    expect(removeMember).toHaveBeenCalledWith("device", TREE, MEMBER_KEY, V1_MEMBER, undefined);
  });

  it("removeMember removes the member, returns the new key tree and emits", async () => {
    const removeMember = jest.fn(async () => NEW_TREE);
    const { client, session, events } = setup({ removeMember });
    const update = await client.removeMember(session, { legacyDeviceId: "device", member: MEMBER });
    expect(removeMember).toHaveBeenCalledWith(
      "device",
      TREE,
      MEMBER_KEY,
      { ...MEMBER, permissions: Permissions.OWNER },
      undefined,
    );
    expect(treeRecordOf(update)).toBe(NEW_TREE);
    expect(events).toHaveBeenCalledWith({ type: "member-removed", memberId: MEMBER.id });
  });

  it("removeMember emits nothing when it fails", async () => {
    const { client, session, events } = setup({
      removeMember: jest.fn(async () => {
        throw new Error("refused");
      }),
    });
    await expect(
      client.removeMember(session, { legacyDeviceId: "device", member: MEMBER }),
    ).rejects.toThrow("refused");
    expect(events).not.toHaveBeenCalled();
  });

  it("destroy leaves the application and emits a reset", async () => {
    const destroyApplication = jest.fn(async () => ({ trustchainDestroyed: true }));
    const { client, session, events } = setup({ destroyApplication });
    expect(await client.destroy(session)).toEqual({ treeDestroyed: true });
    expect(destroyApplication).toHaveBeenCalledWith(TREE, MEMBER_KEY);
    expect(events).toHaveBeenCalledWith({ type: "reset" });
  });

  it("createMemberKey generates a secp256k1 member key through the key store", async () => {
    const keyStore = createSliceKeyStore(() => STATE);
    const generate = jest.spyOn(keyStore, "generate");
    const initMemberCredentials = jest.fn();
    const { client } = setup({ initMemberCredentials }, STATE, { keyStore });

    const memberKey = memberKeyRecordOf(await client.createMemberKey());

    expect(generate).toHaveBeenCalledWith("member", "ecdsa-secp256k1");
    const { publicKey } = await generate.mock.results[0].value;
    expect(memberKey.pubkey).toBe(crypto.to_hex(publicKey));
    expect(KeyRingMemberKeyRecordSchema.safeParse(memberKey).success).toBe(true);
    expect(memberKey).not.toEqual(MEMBER_KEY);
    expect(initMemberCredentials).not.toHaveBeenCalled();
  });

  it("createMemberKey keeps the mock SDK's own keys in the mock environment", async () => {
    const keyStore = createSliceKeyStore(() => STATE);
    const generate = jest.spyOn(keyStore, "generate");
    const { client } = setup({ initMemberCredentials: jest.fn(async () => MEMBER_KEY) }, STATE, {
      mock: true,
      keyStore,
    });

    expect(memberKeyRecordOf(await client.createMemberKey())).toBe(MEMBER_KEY);
    expect(generate).not.toHaveBeenCalled();
  });

  it("openStream binds the stream to the key tree and the member key", async () => {
    const withAuth = jest.fn(async (_t, _k, job) => job({ accessToken: "token" }));
    const encryptUserData = jest.fn(async () => new Uint8Array([1]));
    const decryptUserData = jest.fn(async () => new Uint8Array([2]));
    const { client, session } = setup({ withAuth, encryptUserData, decryptUserData });
    const stream = client.openStream(session);
    if (!stream) throw new Error("expected a stream");

    expect(stream.ref).toEqual({ treeId: TREE.rootId, streamPath: TREE.applicationPath });
    expect(await stream.withAuth(async token => token.accessToken, "refresh")).toBe("token");
    expect(withAuth).toHaveBeenCalledWith(TREE, MEMBER_KEY, expect.any(Function), "refresh");
    await stream.encrypt(new Uint8Array([0]));
    await stream.decrypt(new Uint8Array([0]));
    expect(encryptUserData).toHaveBeenCalledWith(TREE, new Uint8Array([0]));
    expect(decryptUserData).toHaveBeenCalledWith(TREE, new Uint8Array([0]));
  });

  it("openStream returns null when this instance is not a member", () => {
    const { client, session } = setup({}, mockKeyRingState({ trustchain: null }));
    expect(client.openStream(session)).toBeNull();
  });

  it("hostPairing adds the scanning instance to the key tree", async () => {
    const addMember = jest.fn(async () => undefined);
    jest.mocked(createQRCodeHostInstance).mockImplementation(async params => {
      params.onDisplayQRCode("url");
      return params.addMember({ id: "other", name: "Other", permissions: 1 });
    });
    const { client, session } = setup({ addMember });
    const onDisplayQRCode = jest.fn();

    const update = await client.hostPairing(session, {
      memberName: "Me",
      onDisplayQRCode,
      onDisplayDigits: jest.fn(),
    });

    expect(onDisplayQRCode).toHaveBeenCalledWith("url");
    expect(addMember).toHaveBeenCalledWith(TREE, MEMBER_KEY, {
      id: "other",
      name: "Other",
      permissions: 1,
    });
    expect(update && treeRecordOf(update)).toBe(TREE);
    expect(jest.mocked(createQRCodeHostInstance)).toHaveBeenCalledWith(
      expect.objectContaining({
        trustchainApiBaseUrl: "https://trustchain.test",
        memberCredentials: MEMBER_KEY,
        memberName: "Me",
        initialTrustchainId: TREE.rootId,
      }),
    );
  });

  it("hostPairing without key tree throws NoTrustchainInitialized when the member joins", async () => {
    jest
      .mocked(createQRCodeHostInstance)
      .mockImplementation(async params => params.addMember({ id: "x", name: "x", permissions: 1 }));
    const { client, session } = setup({}, mockKeyRingState({ trustchain: null }));
    await expect(
      client.hostPairing(session, {
        memberName: "Me",
        onDisplayQRCode: jest.fn(),
        onDisplayDigits: jest.fn(),
      }),
    ).rejects.toMatchObject({ category: "no-tree-for-seed", message: "NoTrustchainInitialized" });
  });

  it("joinPairing returns null when the candidate flow returns nothing", async () => {
    jest.mocked(createQRCodeCandidateInstance).mockResolvedValue(undefined);
    const { client, session } = setup();
    const onRequestPairingCode = jest.fn();
    expect(
      await client.joinPairing(session, {
        memberName: "Me",
        scannedUrl: "url",
        onRequestPairingCode,
      }),
    ).toBeNull();
    expect(jest.mocked(createQRCodeCandidateInstance)).toHaveBeenCalledWith(
      expect.objectContaining({
        scannedUrl: "url",
        memberName: "Me",
        onRequestQRCodeInput: onRequestPairingCode,
        initialTrustchainId: TREE.rootId,
      }),
    );
  });

  it("maps v1 failures to typed errors that keep the v1 message", async () => {
    const { client, session } = setup({
      restoreTrustchain: jest.fn(async () => {
        throw new TrustchainNotAllowed("permissions not available");
      }),
    });
    const failure = await client.restore(session).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(KeyRingNotAllowedError);
    expect(failure).toMatchObject({ message: "permissions not available" });
    expect(keyRingErrorForDisplay(failure)).toBeInstanceOf(TrustchainNotAllowed);
  });

  it("lets other failures through unchanged", async () => {
    const disconnected = new Error("disconnected");
    disconnected.name = "DeviceDisconnectedWhileSendingError";
    const { client, session } = setup({
      restoreTrustchain: jest.fn(async () => {
        throw disconnected;
      }),
    });
    await expect(client.restore(session)).rejects.toBe(disconnected);
  });

  it("needs the legacy device id outside a device session", async () => {
    const { client, session } = setup({ getOrCreateTrustchain: jest.fn() });
    await expect(client.activate(session, {})).rejects.toThrow(
      "legacyDeviceId is required outside a DIE device session",
    );
  });

  it("forDeviceSession builds a client on the session transport, sharing the lifecycle", async () => {
    const getOrCreateTrustchain = jest.fn(async (_deviceId: string) => ({
      type: TrustchainResultType.restored,
      trustchain: TREE,
    }));
    const { client, session, createSdk, createSessionTransport } = setup({ getOrCreateTrustchain });
    const deviceSession = { dmk: {} as never, sessionId: "session-1" };

    const sessionClient = client.forDeviceSession(deviceSession);
    await sessionClient.activate(session, { legacyDeviceId: "ignored" });

    expect(sessionClient.lifecycle.onKeyRotation).toBe(client.lifecycle.onKeyRotation);
    expect(createSdk).toHaveBeenCalledTimes(2);
    expect(getOrCreateTrustchain.mock.calls[0][0]).toBe("session-1");
    const deviceAccess = createSdk.mock.calls[1][0] as (
      id: string,
    ) => (job: (transport: unknown) => Observable<unknown>) => Observable<unknown>;
    await lastValueFrom(deviceAccess("any")(transport => of(transport)));
    expect(createSessionTransport).toHaveBeenCalledWith(deviceSession);
  });

  it("invalidateAuth drops the cached token", () => {
    const invalidateJwt = jest.fn();
    const { client } = setup({ invalidateJwt });
    client.invalidateAuth();
    expect(invalidateJwt).toHaveBeenCalled();
  });
});
