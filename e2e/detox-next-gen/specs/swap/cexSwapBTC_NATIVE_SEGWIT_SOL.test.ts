/**
 * BTC → SOL swap via a centralized (CEX) provider, end-to-end via Speculos.
 * Mirrors `e2e/mobile/specs/swap/swapBTC_NATIVE_SEGWIT_SOL.spec.ts`.
 *
 * The whole flow lives in the shared {@link runCexSwapTest} runner; this spec
 * only declares the pair (cross-chain → addresses derive on the Bitcoin then
 * Solana apps; both are single-network so the drawer skips the network step.
 * The SOL "to" account is seeded into userdata/device-ready.json).
 */
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCexSwapTest } from "../../flows/swap/cexSwap.runner";

runCexSwapTest(Account.BTC_NATIVE_SEGWIT_1, Account.SOL_1);
