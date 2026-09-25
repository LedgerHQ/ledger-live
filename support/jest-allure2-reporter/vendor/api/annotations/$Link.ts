import { $Push } from 'jest-metadata';
import type { Link } from '@support/jest-allure2-reporter';

import { LINKS } from '../../metadata/constants';

export const $Link = (maybeUrl: string | Link, maybeName?: string) => {
  const link =
    typeof maybeUrl === 'string' ? { name: maybeName ?? maybeUrl, url: maybeUrl } : maybeUrl;

  $Push(LINKS, link);
};
