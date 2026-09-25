import { $Label } from './$Label';

export const $Tag = (...tagNames: string[]) => $Label('tag', ...tagNames);
