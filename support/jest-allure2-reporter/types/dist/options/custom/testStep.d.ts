import type { TestStepCustomizer } from '@support/jest-allure2-reporter';
import type { TestStepExtractor } from '../types';
export declare function testStep(customizer: null | undefined): undefined;
export declare function testStep<Context>(customizer: TestStepCustomizer<Context>): TestStepExtractor<Context>;
export declare function testStep<Context>(customizer: TestStepCustomizer<Context> | null | undefined): TestStepExtractor<Context> | undefined;
