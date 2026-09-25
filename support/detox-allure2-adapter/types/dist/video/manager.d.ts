import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import type { DetoxAllure2AdapterDeviceVideoOptions, OnErrorHandlerFn } from '../types';
import type { DeviceWrapper } from '../utils';
export interface VideoManagerConfig {
    device: DeviceWrapper;
    options: Partial<DetoxAllure2AdapterDeviceVideoOptions> | true;
    onError: OnErrorHandlerFn;
}
export declare class VideoManager {
    private readonly options;
    private readonly saveAll;
    private readonly lazyStart;
    private recordingSession?;
    constructor(config: VideoManagerConfig);
    ensureRecording(): Promise<void>;
    ensureRecordingEager(): Promise<void>;
    stopAndAttach(allure: AllureRuntime | undefined, failed: boolean): Promise<void>;
}
