import type { StepArgs, StepDescription } from '../../types';
import { concat, msg, truncate } from '../../utils';
import type {
  AtomicPredicate,
  Predicate,
  CompoundPredicate,
  DescendantPredicate,
  AncestorPredicate,
} from '../detox-payload';

type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export function formatPredicate(predicate?: Predicate, prefix = ''): StepDescription {
  const result = _formatPredicate(predicate, prefix, false);
  result.message = truncate(result.message);

  return result;
}

function _formatPredicate(
  predicate: Predicate | undefined,
  prefix: string,
  prependAND: boolean,
): Writable<StepDescription> {
  if (!predicate) {
    return msg('?');
  }

  switch (predicate?.type) {
    case 'and': {
      return formatCompoundPredicate(predicate, prefix);
    }
    case 'descendant': {
      return formatDescendantPredicate(predicate, prefix);
    }
    case 'ancestor': {
      return formatAncestorPredicate(predicate, prefix);
    }
    default: {
      const result = formatBasePredicate(predicate as AtomicPredicate, prefix);
      return prependAND ? concat('&&', result) : result;
    }
  }
}

function formatCompoundPredicate(predicate: CompoundPredicate, prefix = ''): StepDescription {
  const { predicates = [] } = predicate;
  if (!Array.isArray(predicates)) {
    return msg('?');
  }

  const result: Writable<StepDescription> =
    predicates
      .map((p: Predicate, index: number) => _formatPredicate(p, prefix, index > 0))
      .reduce((a: StepDescription | null, b: StepDescription) => (a ? concat(a, b) : b), null) ??
    msg('?');

  result.message = `(${result.message})`;
  return result;
}

function formatDescendantPredicate(predicate: DescendantPredicate, prefix = ''): StepDescription {
  const { predicate: descendant } = predicate;
  return concat('containing', formatPredicate(descendant, join(prefix, 'descendant')));
}

function formatAncestorPredicate(predicate: AncestorPredicate, prefix = ''): StepDescription {
  const { predicate: ancestor } = predicate;
  return concat('inside', formatPredicate(ancestor, join(prefix, 'ancestor')));
}

function formatBasePredicate(predicate: AtomicPredicate, prefix = ''): StepDescription {
  const { atIndex, isRegex, type, value } = predicate;
  const _ = (name: string | undefined) => join(prefix, name);

  if (value == null || value === '') {
    return msg('(?)');
  }

  const index$ = atIndex == null ? '' : `[${atIndex}]`;
  const args: StepArgs = { [_(type)]: value };
  if (index$) {
    args[_('index')] = atIndex;
  }

  const value$ = String(value);

  if (isRegex) {
    return formatRegexPredicate(type, value$, index$, args);
  }

  if (isTextPredicate(type)) {
    return formatTextPredicate(value$, index$, args);
  }

  if (type === 'traits') {
    return formatTraitsPredicate(value$, index$, args);
  }

  if (type === 'id') {
    return formatIdPredicate(value$, index$, args);
  }

  if (type === 'type') {
    return formatTypePredicate(value$, index$, args);
  }

  return formatDefaultPredicate(type, value$, index$, args);
}

function formatRegexPredicate(
  type: string | undefined,
  value: string,
  index: string,
  args: StepArgs,
): StepDescription {
  return {
    message: `[${type}] ~ ${value}${index}`,
    args,
  };
}

function isTextPredicate(
  type: string | undefined,
): type is 'label' | 'accessibilityLabel' | 'text' {
  return type === 'label' || type === 'accessibilityLabel' || type === 'text';
}

function formatTextPredicate(value: string, index: string, args: StepArgs): StepDescription {
  return {
    message: `"${value}"${index ? ' ' : ''}${index}`,
    args,
  };
}

function formatTraitsPredicate(value: string, index: string, args: StepArgs): StepDescription {
  return {
    message: `[${value}]${index}`,
    args,
  };
}

function formatIdPredicate(value: string, index: string, args: StepArgs): StepDescription {
  return {
    message: `#${value}${index}`,
    args,
  };
}

function formatTypePredicate(value: string, index: string, args: StepArgs): StepDescription {
  return {
    message: `${value}${index}`,
    args,
  };
}

function formatDefaultPredicate(
  type: string | undefined,
  value: string,
  index: string,
  args: StepArgs,
): StepDescription {
  return {
    message: `[${type}] = ${value}${index}`,
    args,
  };
}

function join(a: string | undefined, b: string | undefined): string {
  return a && b ? `${a}_${b}` : a || b || '';
}
