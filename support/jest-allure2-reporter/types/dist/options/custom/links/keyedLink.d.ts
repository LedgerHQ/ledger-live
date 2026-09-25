import type { KeyedLinkCustomizer, KeyedLinkExtractor } from '@support/jest-allure2-reporter';
export declare function keyedLink<Context>(value: KeyedLinkCustomizer<Context>, type: string): KeyedLinkExtractor<Context> | undefined;
