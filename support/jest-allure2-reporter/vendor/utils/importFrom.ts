import path from 'node:path';

import { log } from '../logger';

import { asArray } from './asArray';

export async function importFrom(module: string, lookup: string | string[]) {
  const filename = require.resolve(module, { paths: asArray(lookup) });
  const dirname = path.dirname(filename);
  const exports = await import(filename).then((module) => module.default ?? module);
  const result = { filename, dirname, exports };
  log.trace({ paths: lookup }, 'resolve module %j -> %j', module, filename);

  return result;
}
