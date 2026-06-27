/**
 * ETH → ETH_USDT swap via a centralized (CEX) provider, end-to-end via
 * Speculos. Mirrors `e2e/mobile/specs/swap/swapETH_ETH_USDT.spec.ts`.
 *
 * The whole flow lives in the shared {@link runCexSwapTest} runner; this spec
 * only declares the pair (same-chain ERC20 → the drawer shows a network step).
 */
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { runCexSwapTest } from "../../flows/swap/cexSwap.runner";

runCexSwapTest(Account.ETH_1, TokenAccount.ETH_USDT_1);
