/**
 * ETH → BTC swap via a centralized (CEX) provider, end-to-end via Speculos.
 * Mirrors `e2e/mobile/specs/swap/swapETH_BTC.spec.ts`.
 *
 * The whole flow lives in the shared {@link runCexSwapTest} runner; this spec
 * only declares the pair (cross-chain → addresses derive on the Ethereum then
 * Bitcoin apps; the runner detects each side's drawer network step at runtime —
 * ETH shows one, BTC doesn't).
 */
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCexSwapTest } from "../../flows/swap/cexSwap.runner";

runCexSwapTest(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1);
