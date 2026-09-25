import type { KeyedLabelCustomizer, KeyedLabelExtractor } from '@support/jest-allure2-reporter';
export declare function keyedLabel<Context>(value: KeyedLabelCustomizer<Context>): KeyedLabelExtractor<Context> | undefined;
