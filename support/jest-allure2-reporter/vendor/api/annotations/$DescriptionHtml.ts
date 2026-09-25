import { $Push } from 'jest-metadata';

import { DESCRIPTION_HTML } from '../../metadata/constants';

export const $DescriptionHtml = (html: string) => $Push(DESCRIPTION_HTML, html);
