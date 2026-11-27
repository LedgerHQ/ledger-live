import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { KeyRingMemberKeyRecordSchema } from "@domain/entity-key-ring";
import { createSliceKeyStore, generateV1MemberKey } from "./sliceKeyStore";

async function requireHandle(keys: ReturnType<typeof createSliceKeyStore>) {
  const handle = await keys.current();
  if (!handle) throw new Error("expected a member key");
  return handle;
}

describe("createSliceKeyStore", () => {
  it("holds the secp256k1 member key of the slice and signs with it", async () => {
    const memberCredentials = generateV1MemberKey();
    const keys = createSliceKeyStore(() => mockKeyRingState({ memberCredentials }));
    const handle = await requireHandle(keys);

    const message = crypto.hash(new TextEncoder().encode("challenge"));
    const signature = await keys.sign(handle, message);
    const publicKey = await keys.publicKey(handle);

    expect(handle).toEqual({ alias: "member", algorithm: "ecdsa-secp256k1" });
    expect(publicKey && crypto.to_hex(publicKey)).toBe(memberCredentials.pubkey);
    expect(publicKey && crypto.verify(message, signature, publicKey)).toBe(true);
  });

  it("has no key when the slice has none, and a null public key for its handle", async () => {
    const keys = createSliceKeyStore(() => mockKeyRingState({ memberCredentials: null }));
    expect(await keys.current()).toBeNull();
    expect(await keys.publicKey({ alias: "member", algorithm: "ecdsa-secp256k1" })).toBeNull();
  });

  it("follows the slice: a reset changes the key behind the same handle", async () => {
    let state = mockKeyRingState({ memberCredentials: generateV1MemberKey() });
    const keys = createSliceKeyStore(() => state);
    const handle = await requireHandle(keys);
    const before = await keys.publicKey(handle);
    state = mockKeyRingState({ memberCredentials: generateV1MemberKey() });
    expect(await keys.publicKey(handle)).not.toEqual(before);
  });

  it("generates a member key without storing it, and signs with it", async () => {
    const keys = createSliceKeyStore(() => mockKeyRingState({ memberCredentials: null }));
    const { handle, publicKey } = await keys.generate("member", "ecdsa-secp256k1");
    const message = crypto.hash(new TextEncoder().encode("challenge"));

    expect(await keys.current()).toBeNull();
    expect(await keys.publicKey(handle)).toEqual(publicKey);
    expect(crypto.verify(message, await keys.sign(handle, message), publicKey)).toBe(true);
  });

  it("refuses a key v1 cannot hold", async () => {
    const keys = createSliceKeyStore(() => mockKeyRingState());
    await expect(keys.generate("member", "ml-dsa-65")).rejects.toThrow(
      "The v1 key store only holds the ecdsa-secp256k1 member key",
    );
  });

  it("deletes nothing: the slice reset replaces the key", async () => {
    const memberCredentials = generateV1MemberKey();
    const keys = createSliceKeyStore(() => mockKeyRingState({ memberCredentials }));
    await keys.delete(await requireHandle(keys));
    expect(keys.memberCredentials()).toEqual(memberCredentials);
  });
});

describe("generateV1MemberKey", () => {
  it("generates a valid, new member key each time", () => {
    const first = generateV1MemberKey();
    expect(KeyRingMemberKeyRecordSchema.safeParse(first).success).toBe(true);
    expect(generateV1MemberKey().privatekey).not.toBe(first.privatekey);
  });
});
