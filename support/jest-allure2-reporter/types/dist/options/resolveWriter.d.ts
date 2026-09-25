import type { AllureWriter } from 'allure-store';
import type { ReporterConfig } from './types';
export declare function resolveWriter(rootDirectory: string, config: ReporterConfig): Promise<AllureWriter>;
