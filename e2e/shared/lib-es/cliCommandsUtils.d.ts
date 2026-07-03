import { Account, TokenAccount } from "./enum/Account";
import { Transaction } from "./models/Transaction";
export type LiveDataCommandOptions = {
    readonly useScheme?: boolean;
    readonly currency?: string;
};
export declare const getAccountAddress: (account: Account | TokenAccount) => Promise<string>;
export declare const liveDataCommand: (account: Account | TokenAccount, options?: LiveDataCommandOptions) => {
    (userdataPath?: string): Promise<void>;
    canUseGeneratedUserdata(): boolean;
};
/**
 * Append an unactivated/empty account directly to userdata's `app.json`.
 *
 * Use this instead of {@link liveDataCommand} for empty-balance test accounts
 * at indices beyond the first empty one. The standard `liveData --index N`
 * relies on `bridge.scanAccounts`, whose gap-limit (`mandatoryEmptyAccountSkip`)
 * stops scanning after the first unused account, so an empty TRX_3 (index 2)
 * is never emitted when TRX_2 is also empty.
 *
 * This helper:
 *  1. Derives the receive address via Speculos at `account.accountPath`.
 *  2. Derives the device's `seedIdentifier` via Speculos at the currency's
 *     seed-identifier path.
 *  3. Writes a minimal `AccountRaw` stub into `data.accounts` of `app.json`.
 *
 * The stub is idempotent (no-op if an account with the same id already exists).
 */
export declare const addEmptyAccountCommand: (account: Account, options?: LiveDataCommandOptions) => (userdataPath?: string) => Promise<void>;
export declare const liveDataWithAddressCommand: (account: Account | TokenAccount, options?: LiveDataCommandOptions) => {
    (userdataPath?: string): Promise<string>;
    canUseGeneratedUserdata(): boolean;
};
export declare const liveDataWithParentAddressCommand: (liveDataAccount: Account | TokenAccount, accountToAssign: TokenAccount) => {
    (userdataPath?: string): Promise<string>;
    canUseGeneratedUserdata(): boolean;
};
export declare const liveDataWithRecipientAddressCommand: (tx: Transaction, options?: LiveDataCommandOptions) => (userdataPath?: string) => Promise<string>;
export declare function parseTokenAllowanceCliOutput(output: string): {
    allowanceStr: string;
    unitMagnitude: number;
};
/**
 * Returns current allowance as a decimal string if {@link minAmount}
 * is covered, otherwise `0`.
 */
export declare const isTokenAllowanceSufficientCommand: (account: TokenAccount, spenderAddress: string, minAmount: string) => Promise<string | 0>;
/**
 * Returns the raw on-chain ERC-20 allowance as a decimal string in smallest
 * units. Use when an exact-value assertion is needed (e.g. assert allowance
 * is exactly zero after a revoke). Use {@link isTokenAllowanceSufficientCommand}
 * when only a threshold check is needed.
 */
export declare const getTokenAllowanceCommand: (account: TokenAccount, spenderAddress: string) => Promise<string>;
/**
 * Runs ledger-live CLI token approval with Speculos device confirmation, managing
 * `DISABLE_TRANSACTION_BROADCAST` around the CLI call.
 */
export declare const approveTokenCommand: (account: TokenAccount, spender: string, approveAmount: string) => Promise<string>;
export declare const revokeTokenCommand: (account: TokenAccount, spender: string) => Promise<string>;
export declare function setDisableTransactionBroadcastEnv(value: string | undefined): string | undefined;
//# sourceMappingURL=cliCommandsUtils.d.ts.map