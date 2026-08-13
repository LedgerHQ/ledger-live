import type { TxData } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Craft-time extras for pox-5's `stake` call, carried through the framework's `MaybeTxData`
 * escape hatch (`TransactionIntent<MemoType, StacksTxData>`) since `StakingTransactionIntent`
 * has no generic field for a lock duration or pool-specific calldata.
 *
 * Since `StacksTxData` doesn't extend the framework's `TxDataNotSupported`, `MaybeTxData` makes
 * `data` a *required* field on every `TransactionIntent` for this module -- transfers and
 * `undelegate` intents don't need `numCycles`/`startBurnHt`, so those fields are optional here and
 * only enforced (with a runtime error) by `craftTransaction`'s staking-`delegate` branch. No other
 * coin module was found already using a custom `TxDataType`, so this is a first, deliberately
 * minimal instance of the pattern.
 */
export interface StacksTxData extends TxData {
  type: "stacks-pox";
  /** Number of reward cycles to lock for (pox-5 `MAX_NUM_CYCLES` bounds this to 1-96). Required
   * for staking `delegate`; ignored otherwise. */
  numCycles?: number;
  /** Burnchain height after which the stake becomes eligible; defaults to current height + buffer.
   * Required for staking `delegate`; ignored otherwise. */
  startBurnHt?: number;
  /** Optional pool-specific calldata forwarded to the target signer-manager contract. */
  signerCalldata?: string;
}
