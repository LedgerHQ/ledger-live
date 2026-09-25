import type { KeyedLabelCustomizer, Label, MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function simplifyLabelsMap<Context>(customizer: Record<string, KeyedLabelCustomizer<Context>>): Record<string, PropertyExtractor<Context, Label[], MaybePromise<Label[]>>>;
