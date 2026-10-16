import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import type {
  BridgeApi,
  ChainReads,
  FamilyAccountShape,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AccountReadiness } from "@ledgerhq/types-live";

/** What the family hooks add to an account, read through the chain reads of its path. */
export type FamilyData = {
  familyShape?: FamilyAccountShape;
  tokenShapes?: Record<string, FamilyAccountShape>;
  readiness?: AccountReadiness;
  /** The next sequence of the address, for a family that stores it (`accountSequenceSupported`). */
  sequence?: number;
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * The family's account fields, token account fields and readiness, as the legacy path reads them:
 *
 * - `getAccountInfo` is read once, only when a mapper consumes it;
 * - the account fields fail the sync when the read or the mapper rejects (the framework cannot
 *   tell whether the family needs them), except when the path cannot serve the read: the mapper is
 *   skipped and the account keeps its stored fields;
 * - the token account fields get no metadata when the read fails;
 * - a failed readiness lookup leaves the readiness undefined, so the account keeps the stored one;
 * - the sequence of a family that stores it fails the sync when its read rejects, except when the
 *   path cannot serve the read: the account keeps its stored sequence.
 */
export async function readFamilyData(
  bridgeApi: Pick<
    BridgeApi,
    | "buildAccountShape"
    | "buildTokenAccountShapes"
    | "getAccountReadiness"
    | "accountSequenceSupported"
  >,
  chain: ChainReads,
  currency: CryptoCurrency,
  address: string,
): Promise<FamilyData> {
  // Called on `bridgeApi`, as the hooks are declared.
  const { buildAccountShape, buildTokenAccountShapes, getAccountReadiness } = bridgeApi;
  const info: Promise<AccountInfo> | undefined =
    buildAccountShape || buildTokenAccountShapes ? chain.getAccountInfo(address) : undefined;

  const familyShape =
    buildAccountShape && info
      ? info.then(
          accountInfo => buildAccountShape.call(bridgeApi, address, accountInfo),
          (error: unknown) => {
            if (error instanceof ChainReadUnsupportedError) return undefined;
            throw error;
          },
        )
      : undefined;

  const tokenShapes =
    buildTokenAccountShapes && info
      ? info
          .catch((error: unknown) => {
            log("generic-coin-framework", "getAccountInfo failed, token accounts get no metadata", {
              error: errorMessage(error),
            });
            return undefined;
          })
          .then(accountInfo => buildTokenAccountShapes.call(bridgeApi, address, accountInfo))
      : undefined;

  const readiness = getAccountReadiness
    ? getAccountReadiness.call(bridgeApi, currency, address, chain).catch((error: unknown) => {
        log("generic-coin-framework", "getAccountReadiness failed, leaving readiness undefined", {
          error: errorMessage(error),
        });
        return undefined;
      })
    : undefined;

  const sequence = bridgeApi.accountSequenceSupported
    ? chain.getNextSequence(address).then(Number, (error: unknown) => {
        if (error instanceof ChainReadUnsupportedError) return undefined;
        throw error;
      })
    : undefined;

  const [familyShapeValue, tokenShapesValue, readinessValue, sequenceValue] = await Promise.all([
    familyShape,
    tokenShapes,
    readiness,
    sequence,
  ]);
  return {
    ...(familyShapeValue === undefined ? {} : { familyShape: familyShapeValue }),
    ...(tokenShapesValue === undefined ? {} : { tokenShapes: tokenShapesValue }),
    ...(readinessValue === undefined ? {} : { readiness: readinessValue }),
    ...(sequenceValue === undefined ? {} : { sequence: sequenceValue }),
  };
}
