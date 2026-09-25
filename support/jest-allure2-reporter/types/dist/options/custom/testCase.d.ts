import type { TestCaseCustomizer } from '@support/jest-allure2-reporter';
import type { TestCaseExtractor } from '../types';
export declare function testCase<Context>(customizer: TestCaseCustomizer<Context>): TestCaseExtractor<Context>;
export declare function testCase(customizer: null | undefined): undefined;
export declare function testCase<Context>(customizer: TestCaseCustomizer<Context> | null | undefined): TestCaseExtractor<Context> | undefined;
