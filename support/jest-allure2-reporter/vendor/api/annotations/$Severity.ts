import type { Severity } from '@support/jest-allure2-reporter';

import { $Label } from './$Label';

export const $Severity = (value: Severity) => $Label('severity', value);
