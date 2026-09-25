import type { KeyedParameterCustomizer, MaybePromise, Parameter, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function parametersMap<Context>(customizer: Record<string, KeyedParameterCustomizer<Context>>): PropertyExtractor<Context, MaybePromise<Parameter[]>>;
