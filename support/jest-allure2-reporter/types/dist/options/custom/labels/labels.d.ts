import type { Label, LabelsCustomizer, MaybeNullish, MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function labels<Context>(customizer: LabelsCustomizer<Context>): PropertyExtractor<Context, Label[], MaybePromise<Label[]>>;
export declare function labels<Context>(customizer: MaybeNullish<LabelsCustomizer<Context>>): PropertyExtractor<Context, Label[], MaybePromise<Label[]>> | undefined;
