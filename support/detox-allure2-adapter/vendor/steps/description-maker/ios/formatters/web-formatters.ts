import type { StepDescription } from '../../types';
import { msg, concat, glue, truncate } from '../../utils';
import type {
  Predicate,
  WebExpectationInvocation,
  WebInvocation,
  WebPredicate,
  WebScriptParams,
  WebScriptWithArgsParams,
  WebTextActionParams,
} from '../detox-payload';
import { formatPredicate } from './predicate-formatters';

function formatWebViewContext(predicate?: Predicate): StepDescription {
  const webView = msg('WebView');
  if (!predicate) {
    return glue(webView, ':');
  }

  return glue(webView, ' ', formatPredicate(predicate), ':');
}

export function formatWebPredicate(
  predicate: WebPredicate | undefined,
  atIndex: number | undefined,
  prefix = '',
): StepDescription {
  if (!predicate) {
    return msg('?');
  }

  const { type, value } = predicate;
  const _ = (name: string | undefined) =>
    prefix && name ? `${prefix}_${name}` : prefix || name || '';
  const index$ = atIndex == null ? '' : `[${atIndex}]`;

  const args = { [_(type)]: value };
  if (index$) {
    args[_(type) + '_index'] = `${atIndex}`;
  }

  switch (type) {
    case 'id': {
      return msg(`#${value}${index$}`, args);
    }
    case 'class': {
      return msg(`.${value}${index$}`, args);
    }
    case 'tag': {
      return msg(`${value}${index$}`, args);
    }
    case 'css': {
      return msg(`${value}${index$}`, args);
    }
    case 'xpath': {
      return msg(`xpath:${value}${index$}`, args);
    }
    case 'name':
    case 'label':
    case 'href': {
      return msg(`[${type}=${value}]${index$}`, args);
    }
    case 'hrefContains': {
      return msg(`[href*=${value}]${index$}`, args);
    }
    default: {
      return msg(`[${type}=${value}]${index$}`, args);
    }
  }
}

const formatWebExpectationVerb = (invocation: WebExpectationInvocation): StepDescription => {
  const hasNot = invocation.webModifiers?.includes('not');
  const expectation = invocation.webExpectation || '';
  const verb = expectation
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();

  const toOrNotTo = msg(hasNot ? 'not to' : 'to');

  const formatExpectationClause = (): StepDescription => {
    const [expected] = (invocation.params as [string] | undefined) || [];
    switch (expectation) {
      case 'toHaveText': {
        return msg(`have text "${expected}"`, { expected_text: expected });
      }
      default: {
        return msg(verb.replace(/^to /, ''));
      }
    }
  };

  return concat(toOrNotTo, formatExpectationClause());
};

export const formatWebAction = (invocation: WebInvocation): StepDescription | null => {
  const { webAction, webPredicate, webAtIndex, params, predicate } = invocation;
  if (!webAction) {
    return null;
  }

  const context = formatWebViewContext(predicate);
  const target = formatWebPredicate(webPredicate, webAtIndex, 'web');

  switch (webAction) {
    case 'scrollToView': {
      return concat(context, 'Scroll to', target);
    }
    case 'tap': {
      return concat(context, 'Tap', target);
    }
    case 'clearText': {
      return concat(context, 'Clear text in', target);
    }
    case 'focus': {
      return concat(context, 'Focus on', target);
    }
    case 'moveCursorToEnd': {
      return concat(context, 'Move cursor to end in', target);
    }
    case 'selectAllText': {
      return concat(context, 'Select all text in', target);
    }
    case 'getText': {
      return concat(context, 'Get text from', target);
    }
    case 'getTitle': {
      return concat(context, 'Get title of', target);
    }
    case 'getCurrentUrl': {
      return concat(context, 'Get current URL');
    }
    case 'typeText': {
      const [text] = params as WebTextActionParams;
      return concat(context, 'Type', msg(`"${text}"`, { text }), 'in', target);
    }
    case 'replaceText': {
      const [text] = params as WebTextActionParams;
      return concat(context, 'Replace text in', target, 'with', msg(`"${text}"`, { text }));
    }
    case 'runScript': {
      const [script] = params as WebScriptParams;
      return concat(context, msg('Run script on', { script: truncate(script, 1000) }), target);
    }
    case 'runScriptWithArgs': {
      const [script, args] = params as WebScriptWithArgsParams;
      const spreadArgs = (args || []).reduce((acc: Record<string, unknown>, arg, index) => {
        acc[`arg${index}`] = arg;
        return acc;
      }, {});

      return concat(
        context,
        msg('Run script with args on', { script: truncate(script, 1000), ...spreadArgs }),
        target,
      );
    }
    default: {
      return msg(`Web action: ${webAction}`);
    }
  }
};

export const formatWebExpectation = (
  invocation: WebExpectationInvocation,
): StepDescription | null => {
  if (!invocation.webExpectation) {
    return null;
  }

  const context = formatWebViewContext(invocation.predicate);

  return concat(
    context,
    'Expect',
    formatWebPredicate(invocation.webPredicate, invocation.webAtIndex, 'web'),
    formatWebExpectationVerb(invocation),
  );
};
