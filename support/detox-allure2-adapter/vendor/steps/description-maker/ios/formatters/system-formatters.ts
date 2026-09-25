import type { StepDescription } from '../../types';
import { msg, concat, truncate } from '../../utils';
import type { Predicate, SystemExpectationMessage, SystemActionMessage } from '../detox-payload';
import { formatPredicate } from './predicate-formatters';

function formatSystemContext(): StepDescription {
  return msg('System:');
}

function formatSystemPredicate(predicate?: Predicate, atIndex?: number): StepDescription | null {
  if (!predicate) {
    return null;
  }

  const predicateWithIndex = { ...predicate, atIndex };
  return formatPredicate(predicateWithIndex);
}

const formatSystemExpectationVerb = (invocation: SystemExpectationMessage): StepDescription => {
  const hasNot = invocation.systemModifiers?.includes('not');
  const expectation = invocation.systemExpectation || '';
  const verb = expectation
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();

  const toOrNotTo = msg(hasNot ? 'not to' : 'to');

  const formatExpectationClause = (): StepDescription => {
    const [expected] = (invocation.params as [string] | undefined) || [];
    switch (expectation) {
      case 'toHaveText': {
        return msg(`have text "${truncate(expected)}"`, { expected_text: expected });
      }
      default: {
        return msg(verb.replace(/^to /, ''));
      }
    }
  };

  return concat(toOrNotTo, formatExpectationClause());
};

export const formatSystemAction = (invocation: SystemActionMessage): StepDescription | null => {
  const { systemAction, systemPredicate, systemAtIndex } = invocation;
  if (!systemAction) {
    return null;
  }

  const context = formatSystemContext();
  const target = formatSystemPredicate(systemPredicate, systemAtIndex);
  const action = msg(systemAction.charAt(0).toUpperCase() + systemAction.slice(1));

  return concat(context, action, 'on', target);
};

export const formatSystemExpectation = (
  invocation: SystemExpectationMessage,
): StepDescription | null => {
  if (!invocation.systemExpectation) {
    return null;
  }

  const context = formatSystemContext();
  const target = formatSystemPredicate(invocation.systemPredicate, invocation.systemAtIndex);

  return concat(context, 'Expect', target, formatSystemExpectationVerb(invocation));
};
