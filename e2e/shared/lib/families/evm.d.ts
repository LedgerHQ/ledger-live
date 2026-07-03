import { Transaction } from "../models/Transaction";
export declare const sendEvmButtonDevice: (tx: Transaction) => void | Promise<void>;
export declare const sendEvmNanoS: (tx: Transaction) => void | Promise<void>;
export declare function sendEVM(tx: Transaction): Promise<void>;
export declare function approveTokenTouchDevices(): Promise<void>;
export declare const approveTokenButtonDevice: () => void | Promise<void>;
export declare function approveToken(): Promise<void>;
export declare function signTypedMessageTouchDevices(): Promise<void>;
export declare const signTypedMessageButtonDevice: () => void | Promise<void>;
export declare function signTypedMessage(): Promise<void>;
//# sourceMappingURL=evm.d.ts.map