import { v5 as uuidv5 } from "uuid";
import type { AccountEntry } from "@domain/entity-account";

/** The namespace live-common derives Wallet API ids with: live apps keep the ids they stored. */
const WALLET_API_ID_NAMESPACE = "c3c78073-6844-409e-9e75-171ab4c7f9a2";

export const walletApiIdOf = (id: string): string => uuidv5(id, WALLET_API_ID_NAMESPACE);

/** The token part of a legacy token account id, as `encodeTokenAccountId` of live-common writes it. */
export const encodeLegacyTokenId = (tokenId: string): string =>
  encodeURIComponent(tokenId).replaceAll("-", "~!dash!~").replaceAll("_", "~!underscore!~");

/** The id a legacy screen knows the account by, or its AccountUUID for an account only known remotely. */
const stableIdOf = (entry: AccountEntry): string => entry.legacyId ?? entry.accountUUID;

export const walletApiAccountIdOf = (entry: AccountEntry): string =>
  walletApiIdOf(stableIdOf(entry));

export const walletApiTokenAccountIdOf = (entry: AccountEntry, tokenId: string): string =>
  walletApiIdOf(`${stableIdOf(entry)}+${encodeLegacyTokenId(tokenId)}`);
