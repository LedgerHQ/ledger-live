import type { SourceCodePluginCustomizer } from '@support/jest-allure2-reporter';
export interface JavaScriptSourceCodePluginOptions {
    docblockPosition?: 'inside' | 'outside';
}
export declare const javascript: SourceCodePluginCustomizer;
