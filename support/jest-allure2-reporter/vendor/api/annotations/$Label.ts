import { $Push } from 'jest-metadata';
import type { LabelName } from '@support/jest-allure2-reporter';

import { LABELS } from '../../metadata/constants';

export const $Label = (name: LabelName, ...values: unknown[]) =>
  $Push(LABELS, ...values.map((value) => ({ name, value: `${value}` })));
