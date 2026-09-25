import { $Link } from './$Link';

export const $Issue = (issue: string) => $Link({ name: issue, url: '', type: 'issue' });
