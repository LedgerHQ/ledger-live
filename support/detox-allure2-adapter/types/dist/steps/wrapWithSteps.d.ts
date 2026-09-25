import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import { type StepLogRecorder } from '../logs';
import { type ScreenshotHelper } from '../screenshots';
import type { WorkerWrapper } from '../utils';
import { type VideoManager } from '../video';
import { type ViewHierarchyHelper } from '../view-hierarchy';
export interface WrapWithStepsOptions {
    detox: typeof import('detox');
    worker: WorkerWrapper;
    allure: AllureRuntime;
    logs?: StepLogRecorder;
    screenshots?: ScreenshotHelper;
    videoManager?: VideoManager;
    viewHierarchy?: ViewHierarchyHelper;
    userArtifacts: 'ignore' | 'copy' | 'move';
}
export declare function wrapWithSteps(options: WrapWithStepsOptions): void;
