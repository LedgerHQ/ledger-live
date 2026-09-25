import type { SourceCodePluginCustomizer } from '@support/jest-allure2-reporter';
export interface TypescriptPluginOptions {
    enabled: boolean;
    extractDocblock: boolean;
}
export declare const typescript: SourceCodePluginCustomizer;
