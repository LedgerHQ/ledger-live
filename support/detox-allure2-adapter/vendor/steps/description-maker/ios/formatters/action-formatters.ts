import type { StepDescription } from '../../types';
import { concat, msg, truncate } from '../../utils';
import type { ActionInvocation } from '../detox-payload';
import { formatWhileCondition } from './expectation-formatters';
import { formatPredicate as p } from './predicate-formatters';

type ActionFormatter<T extends ActionInvocation> = (action: T) => StepDescription;

type ActionFormatterMap = Partial<{
  [K in ActionInvocation['action']]: ActionFormatter<Extract<ActionInvocation, { action: K }>>;
}>;

const actionFormatters: ActionFormatterMap = {
  tap: ({ predicate }) => concat('Tap', p(predicate)),

  longPress: ({ predicate, params: [duration] }) =>
    concat(msg('Long press', { duration }), p(predicate)),

  scroll: ({ predicate, params: [distance, direction], while: whileCondition }) => {
    return concat(
      msg(`Scroll ${direction || 'somewhere'} on`, { direction, distance }),
      p(predicate),
      formatWhileCondition(whileCondition),
    );
  },

  scrollTo: ({ predicate, params: [edge, normalizedX, normalizedY] }) =>
    concat(
      msg(`Scroll to ${edge || 'edge'}`, {
        edge,
        ...(normalizedX !== undefined && { x: normalizedX, y: normalizedY }),
      }),
      'on',
      p(predicate),
    ),

  replaceText: ({ predicate, params: [text] }) =>
    concat(msg('Replace text in', { text }), p(predicate)),

  typeText: ({ predicate, params: [text] }) => concat(msg('Type text in', { text }), p(predicate)),

  accessibilityAction: ({ predicate, params: [action] }) =>
    concat(msg(`Activate a11y ${action ? `"${action}"` : 'action'} on`, { action }), p(predicate)),

  setDatePickerDate: ({ predicate, params: [date, format] }) =>
    concat('Set date picker', p(predicate), msg(`${date}`, { date, format })),

  setColumnToValue: ({ predicate, params: [column, value] }) =>
    concat(
      'Set',
      p(predicate),
      'column',
      msg(`[${column}]`, { column }),
      'to:',
      msg(`${truncate(value)}`, { value }),
    ),

  multiTap: ({ predicate, params: [count] }) =>
    concat(msg(`Tap ${count} times on`, { count }), p(predicate)),

  swipe: ({ predicate, params: [direction, speed, amount] }) =>
    concat(
      msg(`Swipe ${direction} on`, {
        direction,
        speed,
        amount,
      }),
      p(predicate),
    ),

  takeScreenshot: ({ predicate, params: [screenshot_name = 'element'] }) =>
    concat(msg('Take screenshot of', { screenshot_name }), p(predicate)),
};

// Main entry point that routes to the correct formatter based on action type
export const formatAction = (action: ActionInvocation): StepDescription | null => {
  const formatter = actionFormatters[action.action];
  const safeAction = action?.params ? action : { ...action, params: [] };
  return formatter ? formatter(safeAction as any) : null;
};
