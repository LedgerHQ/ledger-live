import type {
  KeyedLinkCustomizer,
  KeyedLinkExtractor,
  Link,
  MaybeArray,
  MaybeNullish,
} from '@support/jest-allure2-reporter';
import Handlebars from 'handlebars';

import { appender, compose2 } from '../../common';
import { asArray, thruMaybePromise } from '../../../utils';

export function keyedLink<Context>(
  value: KeyedLinkCustomizer<Context>,
  type: string,
): KeyedLinkExtractor<Context> | undefined {
  if (value == null) {
    return;
  }

  if (typeof value === 'string') {
    return linkFormatter<Context>(value);
  }

  const overrideType = createTypeOverride(type);

  if (typeof value === 'function') {
    return compose2(({ value }) => {
      return thruMaybePromise(value, overrideType);
    }, value);
  }

  const links = asArray(overrideType(value));
  return compose2(appender(links), ({ value }) => asArray(value));
}

function createTypeOverride(type: string): (links: MaybeNullish<MaybeArray<Link>>) => typeof links {
  return (links) => {
    for (const link of asArray(links)) {
      link.type = type;
    }

    return links;
  };
}

function linkFormatter<Context>(format: string): KeyedLinkExtractor<Context> {
  const formatter = Handlebars.compile(format);

  return ({ value }) => {
    return asArray(value).map((link) =>
      link.url
        ? link
        : {
            ...link,
            url: formatter(link),
          },
    );
  };
}
