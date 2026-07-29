/**
 * The headless surface: everything `api/index.ts` builds the `CoinModuleApi`
 * from, and nothing else. What only the `AccountBridge` needs -- sync,
 * operation mapping, account balances, wallet-btc account plumbing -- lives in
 * `bridge/`, so importing this barrel pulls in no rxjs and no wallet-btc
 * account/sync machinery (only its address-validation and explorer helpers).
 *
 * `logic/` modules may be imported directly by `bridge/` (coin selection,
 * address classification, balance arithmetic, the transparent transaction
 * primitives, the PCZT craft/combine/broadcast steps are all shared);
 * the barrel itself stays the api's view.
 */
export { broadcast } from "./transaction/broadcast";
export { combine } from "./transaction/combine";
export { craftTransaction } from "./transaction/craftTransaction";
export type { CraftPlan } from "./transaction/craftTransaction";
export { estimateFees } from "./transaction/estimateFees";
export { getBalance } from "./account/getBalance";
export { getNextValidSequence } from "./account/getNextSequence";
export { lastBlock } from "./history/lastBlock";
export { listOperations } from "./history/listOperations";
export { validateAddress } from "./validateAddress";
