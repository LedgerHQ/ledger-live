import type { KeyedParameterCustomizer } from '@support/jest-allure2-reporter';
import type { ParameterOrPrimitiveExtractor } from './types';
export declare function keyedParameter<Context>(value: KeyedParameterCustomizer<Context>, key: string): ParameterOrPrimitiveExtractor<Context> | undefined;
