import type { KeyedParameterCustomizer } from '@support/jest-allure2-reporter';
import type { ParameterExtractor } from './types';
export declare function simplifyParametersMap<Context>(customizer: Record<string, KeyedParameterCustomizer<Context>>): Record<string, ParameterExtractor<Context>>;
