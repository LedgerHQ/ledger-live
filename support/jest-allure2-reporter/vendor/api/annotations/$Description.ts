import { $Push } from 'jest-metadata';

import { DESCRIPTION } from '../../metadata/constants';

export const $Description = (markdown: string) => $Push(DESCRIPTION, markdown);
