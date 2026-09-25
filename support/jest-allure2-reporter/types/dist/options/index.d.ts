import type { ReporterOptions } from '@support/jest-allure2-reporter';
import type { ReporterConfig } from './types';
export declare function resolveOptions(rootDirectory: string, custom?: ReporterOptions | undefined): Promise<ReporterConfig<void>>;
export declare function resolveExtendsChain(rootDirectory: string, custom: ReporterOptions | undefined): Promise<ReporterOptions[]>;
export { resolveWriter } from './resolveWriter';
export { ReporterConfig } from './types';
