import type { Test, TestCaseResult } from '@jest/reporters';
import type { AllureTestItemMetadata, AllureTestFileMetadata } from '@support/jest-allure2-reporter';
import type { AllureMetadataProxy } from '../metadata';
export declare function onTestFileStart(test: Test, testFileMetadata: AllureMetadataProxy<AllureTestFileMetadata>): void;
export declare function onTestCaseResult(test: Test, testCase: TestCaseResult, testCaseMetadata: AllureMetadataProxy<AllureTestItemMetadata>): void;
export declare function onTestFileResult(test: Test, testFileMetadata: AllureMetadataProxy<AllureTestFileMetadata>): void;
