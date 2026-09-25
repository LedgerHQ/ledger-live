import { $Set } from 'jest-metadata';

import { FULL_NAME } from '../../metadata/constants';

export const $FullName = (value: string) => $Set(FULL_NAME, value);
