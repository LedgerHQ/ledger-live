import type { Account, TokenAccount } from "./enum/Account";
export declare function getGeneratedUserdataDir(): string | null;
export declare function hasGeneratedUserdata(account: Account | TokenAccount): boolean;
export declare function applyGeneratedUserdata(account: Account | TokenAccount, userdataPath?: string): boolean;
export declare function getGeneratedAddress(account: Account | TokenAccount): string | null;
//# sourceMappingURL=generatedUserdata.d.ts.map