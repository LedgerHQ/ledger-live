/**
 * EVM call types that execute code but do NOT transfer native value. Both Blockscout and
 * Etherscan still report a `value` on these entries (inherited from the enclosing call's
 * `msg.value`), so converting them into operations would double-count the native transfer.
 *
 * Shared between the explorer adapter (`etherscan.ts`, where Blockscout exposes the
 * discriminator via `callType` and Etherscan via `type`) and the RPC `trace_block` adapter
 * (`blockOperations.ts`, which reads `action.callType`).
 *
 * Intentionally not re-exported from `adapters/index.ts`.
 */
export const NON_VALUE_TRANSFER_CALL_TYPES = new Set(["delegatecall", "staticcall", "callcode"]);
