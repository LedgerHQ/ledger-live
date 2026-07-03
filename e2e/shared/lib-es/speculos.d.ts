import { SpeculosTransport } from "@ledgerhq/live-common/load/speculos";
import { DeviceModelId } from "@ledgerhq/devices";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "./enum/Account";
import { approveToken, signTypedMessage } from "./families/evm";
import { Transaction } from "./models/Transaction";
import { Delegate } from "./models/Delegate";
import { Swap } from "./models/Swap";
import { AppInfos } from "./enum/AppInfos";
export type Spec = {
    currency?: CryptoCurrency;
    appQuery: {
        model: DeviceModelId;
        appName: string;
        appVersion?: string;
    };
    dependencies?: Dependency[];
    onSpeculosDeviceCreated?: (device: Device) => Promise<void>;
};
export type Dependency = {
    name: string;
    appVersion?: string;
};
export type SpeculosDevice = {
    id: string;
    port: number;
    appName?: string;
    appVersion?: string;
    dependencies?: Dependency[];
};
export declare function setExchangeDependencies(dependencies: Dependency[]): void;
type Specs = {
    [key: string]: Spec;
};
export type Device = {
    transport: SpeculosTransport;
    id: string;
    appPath: string;
};
export declare const specs: Specs;
export declare function startSpeculos(testName: string, spec: Specs[keyof Specs], wantedApiPort?: number): Promise<SpeculosDevice | undefined>;
export declare function stopSpeculos(deviceId: string | undefined): Promise<void>;
export declare function getSpeculosAddress(): string;
export declare function drainSpeculosScreenshots(port: number): Buffer[];
export declare function waitFor(text: string, maxAttempts?: number): Promise<string>;
export declare function waitForReviewTransaction(maxAttempts?: number): Promise<void>;
export declare function fetchCurrentScreenTexts(speculosApiPort: number): Promise<string>;
export declare function getDeviceLabelCoordinates(label: string, speculosApiPort: number): Promise<{
    x: number;
    y: number;
}>;
export declare function fetchAllEvents(speculosApiPort: number): Promise<string[]>;
export declare const pressUntilTextFound: (targetText: string, strictMatch?: boolean | undefined) => string[] | Promise<string[]>;
export declare function containsSubstringInEvent(targetString: string, events: string[]): boolean;
export declare function takeScreenshot(port?: number): Promise<Buffer | undefined>;
export declare const removeMemberLedgerSync: () => void | Promise<void>;
export declare const activateLedgerSync: () => void | Promise<void>;
export declare const activateExpertMode: () => void | Promise<void>;
export declare const activateContractData: () => void | Promise<void>;
export declare const goToSettings: () => void | Promise<void>;
export declare const providePublicKey: () => void | Promise<void>;
type DeviceLabelsReturn = {
    delegateConfirmLabel: string;
    delegateVerifyLabel: string;
    receiveConfirmLabel: string;
    receiveVerifyLabel: string;
    sendVerifyLabel: string;
    sendConfirmLabel: string;
};
export declare function getDeviceLabels(appInfo: AppInfos): DeviceLabelsReturn;
export declare const expectValidAddressDevice: (account: Account, addressDisplayed: string) => void | Promise<void>;
export declare function signSendTransaction(tx: Transaction): Promise<void>;
export declare function getSendEvents(tx: Transaction): Promise<string[]>;
export declare function signDelegationTransaction(delegatingAccount: Delegate): Promise<void>;
export declare function getDelegateEvents(delegatingAccount: Delegate): Promise<string[]>;
export declare const verifyAmountsAndAcceptSwap: (swap: Swap, amount: string) => void | Promise<void>;
export declare const verifyAmountsAndAcceptSwapForDifferentSeed: (swap: Swap, amount: string, errorMessage: string | null) => void | Promise<void>;
export declare const verifyAmountsAndRejectSwap: (swap: Swap, amount: string) => void | Promise<void>;
export declare const exportUfvk: (account: Account) => void | Promise<void>;
export declare const shareViewKey: () => void | Promise<void>;
export declare const acceptEnableTransactionCheck: () => void | Promise<void>;
export { approveToken, signTypedMessage };
//# sourceMappingURL=speculos.d.ts.map