import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { loadMemberCredentials, savePrivateKey } from "./keychain";

export type GetOrCreateMemberCredentialsOptions = {
  wrappingKey?: CryptoKey;
  createMemberCredentials?: () => MemberCredentials | Promise<MemberCredentials>;
  beforePersistCreated?: () => void | Promise<void>;
};

export async function getOrCreateMemberCredentials({
  wrappingKey,
  createMemberCredentials = initMemberCredentials,
  beforePersistCreated,
}: GetOrCreateMemberCredentialsOptions = {}): Promise<MemberCredentials> {
  const existing = await loadMemberCredentials(wrappingKey);
  if (existing) return existing;

  const created = await createMemberCredentials();
  await beforePersistCreated?.();
  await savePrivateKey(created.privatekey, created.pubkey, wrappingKey);
  return created;
}
