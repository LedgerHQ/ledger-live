import { DeepFirst } from "./DeepFirst";

/**
 * Same FIFO input selection as {@link DeepFirst}; used when the user constrains
 * the spendable set via coin control (`excludeUTXOs`) under the Custom strategy.
 */
export class Custom extends DeepFirst {}
