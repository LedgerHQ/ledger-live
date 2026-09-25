import { $Set } from 'jest-metadata';

import { DISPLAY_NAME } from '../../metadata/constants';

export const $DisplayName = (value: string) => $Set(DISPLAY_NAME, value);
