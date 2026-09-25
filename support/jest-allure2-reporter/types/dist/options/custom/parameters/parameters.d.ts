import type { MaybeNullish, MaybePromise, Parameter, ParametersCustomizer, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function parameters<Context>(customizer: ParametersCustomizer<Context>): PropertyExtractor<Context, MaybePromise<Parameter[]>>;
export declare function parameters<Context>(customizer: MaybeNullish<ParametersCustomizer<Context>>): PropertyExtractor<Context, MaybePromise<Parameter[]>> | undefined;
