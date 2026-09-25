import { $Push } from 'jest-metadata';
import type { Parameter, Primitive } from '@support/jest-allure2-reporter';

import { PARAMETERS } from '../../metadata/constants';
import type { ParameterOptions } from '../../runtime';
import { typeAssertions } from '../../utils';

export function $Parameter(name: string, value: Primitive, options?: ParameterOptions): void;
export function $Parameter(parameter: Parameter): void;
export function $Parameter(
  maybeParameter: string | Parameter,
  maybeValue?: Primitive,
  maybeOptions?: ParameterOptions,
) {
  typeAssertions.assertNotNullish(maybeParameter, 'parameter name or options');

  const parameter =
    typeof maybeParameter === 'string'
      ? { ...maybeOptions, name: maybeParameter, value: maybeValue }
      : maybeParameter;

  $Push(PARAMETERS, parameter);
}
