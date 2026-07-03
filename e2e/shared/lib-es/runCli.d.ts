import type { GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
export declare const LEDGER_LIVE_CLI_BIN: string;
export type LedgerKeyRingProtocolOpts = {
    initMemberCredentials?: boolean;
    apiBaseUrl?: string;
    applicationId?: number;
    name?: string;
    getKeyRingTree?: boolean;
    pubKey?: string;
    privateKey?: string;
    device?: string;
    destroyKeyRingTree?: boolean;
    rootId?: string;
    walletSyncEncryptionKey?: string;
    applicationPath?: string;
};
export type LedgerSyncOpts = {
    applicationId?: number;
    name?: string;
    apiBaseUrl?: string;
    pubKey: string;
    privateKey: string;
    rootId: string;
    walletSyncEncryptionKey: string;
    applicationPath: string;
    push?: boolean;
    pull?: boolean;
    data?: string;
    version?: number;
    cloudSyncApiBaseUrl?: string;
    deleteData?: boolean;
};
export type LiveDataOpts = {
    currency?: string;
    index?: number;
    scheme?: string;
    appjson?: string;
    add?: boolean;
};
export type GetAddressOpts = {
    currency?: string;
    device?: string;
    path?: string;
    derivationMode?: string;
    verify?: boolean;
};
export type TokenApprovalOpts = {
    currency: string;
    index: number;
    spender: string;
    approveAmount?: string;
    token: string;
    waitConfirmation?: boolean;
    mode: "revokeApproval" | "approve";
};
export type GetTokenAllowanceOpts = {
    currency: string;
    spenderAddress: string;
    token: string;
    index: number | string;
    format?: "json";
    ownerAddress: string;
};
export declare function runCliCommand(command: string): Promise<string>;
export declare function runCliCommandWithRetry(command: string, retries?: number, delayMs?: number): Promise<string>;
export declare function runCliLiveData(opts: LiveDataOpts): Promise<string>;
export declare function runCliGetAddress(opts: GetAddressOpts): Promise<GetAddressResult>;
export declare function runCliTokenApproval(opts: TokenApprovalOpts): Promise<string>;
export declare function runCliGetTokenAllowance(opts: GetTokenAllowanceOpts): Promise<string>;
//# sourceMappingURL=runCli.d.ts.map