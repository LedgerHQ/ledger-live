import { recordVersions } from "@shared/persistence";
import type { z } from "zod";
import { ACCOUNTS_VERSION_LINE } from "./versionLine";

/**
 * The stored shape of 1 account at v0. The envelope is strict and its legacy `version` stops at
 * the line length. The account `data` stays loose: each app codec reads it.
 */
export const accountEnvelopeSchema = (zod: typeof z) =>
  zod.strictObject({
    data: zod.looseObject({ id: zod.string(), currencyId: zod.string() }),
    /** The legacy step count. An account with no `version` decodes as each app's legacy read did. */
    version: zod.number().int().min(0).max(ACCOUNTS_VERSION_LINE.length).optional(),
  });

/** The versions of 1 stored account. A new version is a `.next` here, never a legacy `version`. */
export const accountsVersions = recordVersions(accountEnvelopeSchema);
