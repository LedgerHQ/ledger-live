import fs from 'node:fs/promises';
import path from 'node:path';
// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import { videokitten, type VideokittenOptions, type RecordingSession } from 'videokitten';

import type { DetoxAllure2AdapterDeviceVideoOptions, OnErrorHandlerFn } from '../types';
import type { DeviceWrapper } from '../utils';

export interface VideoManagerConfig {
  device: DeviceWrapper;
  options: Partial<DetoxAllure2AdapterDeviceVideoOptions> | true;
  onError: OnErrorHandlerFn;
}

export class VideoManager {
  private readonly options: VideokittenOptions;
  private readonly saveAll: boolean;
  private readonly lazyStart: boolean;
  private recordingSession?: RecordingSession;

  constructor(config: VideoManagerConfig) {
    const device = config.device;
    const options: Partial<DetoxAllure2AdapterDeviceVideoOptions> =
      config.options === true ? {} : config.options;

    this.saveAll = options.saveAll ?? false;
    this.lazyStart = options.lazyStart ?? true;
    this.options =
      device.platform === 'ios'
        ? {
            platform: 'ios',
            deviceId: device.id,
            codec: 'h264',
            onError: config.onError,
            ...options.ios,
          }
        : {
            platform: 'android',
            deviceId: device.id,
            adbPath: device.adbPath,
            window: false,
            audio: false,
            onError: config.onError,
            ...options.android,
          };
  }

  async ensureRecording(): Promise<void> {
    if (!this.recordingSession) {
      this.recordingSession = await videokitten(this.options).startRecording();
    }
  }

  async ensureRecordingEager(): Promise<void> {
    if (!this.lazyStart) {
      await this.ensureRecording();
    }
  }

  async stopAndAttach(allure: AllureRuntime | undefined, failed: boolean): Promise<void> {
    if (!this.recordingSession) {
      return;
    }

    const videoPath = await this.recordingSession.stop();
    if (!videoPath) {
      return;
    }

    this.recordingSession = undefined;

    if (allure && (this.saveAll || failed)) {
      allure.fileAttachment(videoPath, {
        name: 'test' + path.extname(videoPath),
        handler: 'move',
      });
    } else {
      await fs.unlink(videoPath);
    }
  }
}
