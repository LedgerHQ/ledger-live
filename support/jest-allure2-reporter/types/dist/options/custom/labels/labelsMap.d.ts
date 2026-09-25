import type { KeyedLabelCustomizer, Label, MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function labelsMap<Context>(customizer: Record<string, KeyedLabelCustomizer<Context>>): PropertyExtractor<Context, Label[], MaybePromise<Label[]>>;
