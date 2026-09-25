import type { PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function isExtractor<Context, Value, Result>(value: unknown): value is PropertyExtractor<Context, Value, Result>;
