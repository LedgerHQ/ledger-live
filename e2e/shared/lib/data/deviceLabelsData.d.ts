import { DeviceModelId } from "@ledgerhq/devices";
type LabelConfig = {
    receiveVerify: {
        [key: string]: string;
        default: string;
    };
    receiveConfirm: {
        [key: string]: string;
        default: string;
    };
    delegateVerify: {
        [key: string]: string;
        default: string;
    };
    delegateConfirm: {
        [key: string]: string;
        default: string;
    };
    sendVerify: {
        [key: string]: string;
        default: string;
    };
    sendConfirm: {
        [key: string]: string;
        default: string;
    };
};
type DeviceLabelsConfig = {
    default: LabelConfig;
} & {
    [key in DeviceModelId]?: LabelConfig;
};
export declare const DEVICE_LABELS_CONFIG: DeviceLabelsConfig;
export {};
//# sourceMappingURL=deviceLabelsData.d.ts.map