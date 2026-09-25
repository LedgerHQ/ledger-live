import type { GlobalExtractorContext } from '@support/jest-allure2-reporter';
import type { TestInvocationMetadata } from 'jest-metadata';
export declare function postProcessMetadata(globalContext: GlobalExtractorContext, testInvocation: TestInvocationMetadata): Promise<void>;
