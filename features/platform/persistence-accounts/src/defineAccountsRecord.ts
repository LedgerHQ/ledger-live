import {
  defineCollectionCodec,
  defineCollectionRecord,
  type CollectionCodec,
  type CollectionCodecDefinition,
  type CollectionRecordDefinition,
  type CollectionStateMapping,
} from "@shared/persistence";
import { accountsVersions } from "./accountsVersions";
import { ACCOUNTS_RECORD_KEY, type StoredAccount } from "./envelope";
import { accountIdOfPayload } from "./envelope.internals";

/** The stored account and back. Each app reads and writes the stored `version` as before. */
export type AccountsCodec<State, Account, Decoded> = CollectionCodec<
  State,
  Account,
  StoredAccount,
  Decoded
>;

/** How the record reads the accounts in the app state, and puts them back at hydration. */
export type AccountsStateMapping<State, Account, Decoded, Action> = CollectionStateMapping<
  State,
  Account,
  Decoded,
  Action
>;

export type AccountsRecord<State, Account, Decoded, Action> = CollectionRecordDefinition<
  State,
  Action,
  Account,
  Decoded
>;

const accountsRecordShape = { key: ACCOUNTS_RECORD_KEY, versions: accountsVersions };

/** The `accounts` record, with each app's key scheme. */
export function defineAccountsRecord<State, Account extends { id: string }, Decoded, Action>({
  codec,
  state,
}: {
  codec: AccountsCodec<State, Account, Decoded>;
  state: AccountsStateMapping<State, Account, Decoded, Action>;
}): AccountsRecord<State, Account, Decoded, Action> {
  return defineCollectionRecord({
    ...accountsRecordShape,
    entryId: account => account.id,
    storedEntryId: accountIdOfPayload,
    codec,
    state,
  });
}

/** The accounts codec alone, for the tools that read and write `app.json` with no Redux. */
export function defineAccountsCodec<State, Account, Decoded>(
  codec: AccountsCodec<State, Account, Decoded>,
): CollectionCodecDefinition<State, Account, Decoded> {
  return defineCollectionCodec({ ...accountsRecordShape, codec });
}
