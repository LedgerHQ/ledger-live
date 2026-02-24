/**
 * Transactional slice – schema and state shape.
 * Holds pending operations (per account). Error messages are UI state (component-local).
 */
import { z } from "zod";
import { OperationSchema } from "../operationHistory/schema";

/** StoredOperation for pending ops (re-use operationHistory schema). */
const StoredOperationSchema = OperationSchema;

/** Pending operations only; no UI state (errors live in component state). */
export const TransactionalStateSchema = z.object({
  /** Pending (unconfirmed) operations per account id. Source of truth for reconstruction / UI. */
  pendingOperationsByAccountId: z.record(z.string(), z.array(StoredOperationSchema)),
});

export type TransactionalState = z.infer<typeof TransactionalStateSchema>;
