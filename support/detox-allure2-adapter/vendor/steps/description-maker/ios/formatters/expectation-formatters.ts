import type { StepDescription } from '../../types';
import { concat, msg, percentVisible, truncate } from '../../utils';
import type { ExpectationInvocation, Invocation } from '../detox-payload';
import { formatPredicate } from './predicate-formatters';

const formatExpectationVerb = (invocation: ExpectationInvocation): string => {
  const hasNot = invocation.modifiers?.includes('not');
  const verb = invocation
    .expectation!.replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
  return `${hasNot ? 'not ' : ''}${verb}`;
};

const formatExpectationParams = (invocation: ExpectationInvocation): StepDescription | null => {
  if (!Array.isArray(invocation.params)) {
    return null;
  }

  const [expected] = invocation.params;

  switch (invocation.expectation) {
    case 'toBeVisible': {
      return typeof expected === 'number'
        ? msg(`by ${percentVisible(expected)}`, { expected })
        : null;
    }

    default: {
      return expected == null ? null : msg(`${truncate(expected)}`, { expected });
    }
  }
};

export const formatWhileCondition = (
  expectation?: ExpectationInvocation,
): StepDescription | null => {
  return expectation
    ? concat(
        'while waiting for',
        formatPredicate(expectation.predicate, 'while'),
        formatExpectationVerb(expectation),
      )
    : null;
};

export const formatExpectation = (invocation: Invocation): StepDescription | null => {
  if (!invocation.expectation) {
    return null;
  }

  return concat(
    'Expect',
    formatPredicate(invocation.predicate),
    formatExpectationVerb(invocation as ExpectationInvocation),
    formatExpectationParams(invocation as ExpectationInvocation),
  );
};
