import { $Set } from 'jest-metadata';
import type { Primitive } from '@support/jest-allure2-reporter';

import { HISTORY_ID } from '../../metadata/constants';

export const $HistoryId = (value: Primitive) => $Set(HISTORY_ID, value);
