import { Transaction } from "../models/Transaction";
import { DeviceLabels } from "../enum/DeviceLabels";
type ActionType = "both" | "right" | "tap" | "swipe" | "confirm" | "hold";
export declare const sendCardanoNanoS: (_tx: Transaction) => void | Promise<void>;
export declare const sendCardanoButtonDevice: (tx: Transaction) => void | Promise<void>;
export declare function sendCardano(tx: Transaction): Promise<void>;
export declare const delegateNanoAction: (label: DeviceLabels, action: ActionType) => void | Promise<void>;
export declare function delegateCardano(): Promise<void>;
export {};
//# sourceMappingURL=cardano.d.ts.map