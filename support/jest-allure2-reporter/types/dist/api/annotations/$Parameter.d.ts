import type { Parameter, Primitive } from '@support/jest-allure2-reporter';
import type { ParameterOptions } from '../../runtime';
export declare function $Parameter(name: string, value: Primitive, options?: ParameterOptions): void;
export declare function $Parameter(parameter: Parameter): void;
