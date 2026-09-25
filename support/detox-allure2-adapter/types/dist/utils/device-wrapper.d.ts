export declare class DeviceWrapper {
    #private;
    private readonly device;
    constructor(device: Detox.Device);
    get id(): string;
    get platform(): "ios" | "android";
    get adbPath(): string | undefined;
}
