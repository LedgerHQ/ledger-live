import { z } from "zod";

/** The public key of a member, branded so it is not mixed with other ids. */
export const KeyRingMemberIdSchema = z.string().brand<"KeyRingMemberId">();

/** An instance or agent of the key tree, as the key ring lists it. */
export const KeyRingMemberSchema = z.object({
  id: KeyRingMemberIdSchema,
  name: z.string(),
});

/** What joining the key tree of the device seed did. */
export const KeyRingActivationOutcomeSchema = z.enum(["created", "joined", "restored"]);

/** Where Cloud Sync stores the data of one key tree stream. Public: holds no key. */
export const KeyRingStreamRefSchema = z.object({
  treeId: z.string(),
  streamPath: z.string(),
});

/** The bearer token a key ring stream hands to authenticated backend calls. */
export const KeyRingAccessTokenSchema = z.object({ accessToken: z.string() });

/** `cache` reuses a valid token, `refresh` renews it when possible, `no-cache` always asks a new one. */
export const KeyRingAuthPolicySchema = z.enum(["cache", "refresh", "no-cache"]);

/** What the device must provide before a key ring device operation. */
export const KeyRingDeviceRequirementSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("app"), appName: z.string() }),
  z.object({
    kind: z.literal("os-feature"),
    feature: z.string(),
    minimumOsVersion: z.string(),
  }),
]);

/**
 * Why a key ring operation failed, the same for every protocol version. `classifyKeyRingError`
 * returns one; the `pairing-*` categories come from `hostPairing` and `joinPairing` only.
 *
 * `not-member`: the backend refuses a key that is not in the key tree. It differs from
 * `not-allowed`, a token without permission on the key tree, and from `member-removed`, this
 * instance removed or without a key tree.
 */
export const KeyRingErrorCategorySchema = z.enum([
  "member-removed",
  "not-allowed",
  "not-member",
  "tree-not-found",
  "no-tree-for-seed",
  "outdated",
  "already-member",
  "member-of-other-tree",
  "user-refused",
  "device-unsupported",
  "network",
  "pairing-closed",
  "pairing-invalid-code",
  "pairing-protocol",
  "pairing-outdated-qr-code",
  "pairing-newer-qr-code",
  "pairing-invalid-qr-code",
]);

/**
 * What `KeyRingLifecycle.subscribe` reports: the key rotated (`tree` is the new stream), a member
 * was removed, or this instance left Ledger Sync (`reset`).
 */
export const KeyRingLifecycleEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("key-rotated"), tree: KeyRingStreamRefSchema }),
  z.object({ type: z.literal("member-removed"), memberId: KeyRingMemberIdSchema }),
  z.object({ type: z.literal("reset") }),
]);

/** The health response of the key ring backend. */
export const KeyRingServiceStatusSchema = z.object({ name: z.string(), version: z.string() });
