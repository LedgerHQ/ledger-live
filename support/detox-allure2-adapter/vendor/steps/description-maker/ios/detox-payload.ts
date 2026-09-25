export type DetoxMessage =
  | InvokeMessage
  | DeliverPayloadMessage
  | SystemActionMessage
  | SystemExpectationMessage;

//#region Predicates
export type PredicateType =
  | 'id'
  | 'text'
  | 'label'
  | 'traits'
  | 'accessibilityLabel'
  | 'accessibilityIdentifier'
  | 'type';

export type Predicate =
  | AtomicPredicate
  | AncestorPredicate
  | DescendantPredicate
  | CompoundPredicate;

export interface CompoundPredicate {
  type: 'and';
  predicates?: Predicate[];
}

export interface AncestorPredicate {
  type: 'ancestor';
  predicate?: Predicate;
}

export interface DescendantPredicate {
  type: 'descendant';
  predicate?: Predicate;
}

export interface AtomicPredicate {
  type?: PredicateType;
  value?: string | string[] | number | boolean;
  isRegex?: boolean;
  atIndex?: number;
  targetElement?: {
    predicate: Predicate;
  };
}
//#endregion Predicates

//#region Web Predicates
export type WebPredicateType =
  | 'id'
  | 'tag'
  | 'class'
  | 'css'
  | 'href'
  | 'hrefContains'
  | 'name'
  | 'label'
  | 'xpath';

export interface WebPredicate {
  type: WebPredicateType;
  value: string;
}
//#endregion Web Predicates

//#region Base Types
export type DetoxAction =
  | 'accessibilityAction'
  | 'longPress'
  | 'multiTap'
  | 'replaceText'
  | 'scroll'
  | 'scrollTo'
  | 'setDatePickerDate'
  | 'setColumnToValue'
  | 'swipe'
  | 'takeScreenshot'
  | 'tap'
  | 'typeText';

export type DetoxExpectation =
  | 'toBeVisible'
  | 'toExist'
  | 'toHaveText'
  | 'toHaveLabel'
  | 'toBeEnabled'
  | 'toBeFocused'
  | 'toBeDisabled';

export type ExpectationModifier = 'not';

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';
export type ScrollEdge = 'top' | 'bottom' | 'left' | 'right';
//#endregion Base Types

//#region Web Types
export type WebAction =
  | 'getTitle'
  | 'getCurrentUrl'
  | 'scrollToView'
  | 'tap'
  | 'clearText'
  | 'focus'
  | 'moveCursorToEnd'
  | 'replaceText'
  | 'selectAllText'
  | 'typeText'
  | 'getText'
  | 'runScript'
  | 'runScriptWithArgs';

export type WebExpectation = 'toExist' | 'toHaveText';
//#endregion Web Types

//#region Base Invocations
interface BaseInvocation {
  type?: string;
  action?: unknown;
  expectation?: unknown;
  predicate?: Predicate;
  timeout?: number;
  atIndex?: number;
  params?: readonly unknown[];
}

export interface ExpectationInvocation extends BaseInvocation {
  type: 'expectation';
  expectation?: DetoxExpectation;
  modifiers?: ExpectationModifier[];
}

export interface BaseActionInvocation extends BaseInvocation {
  type: 'action';
  action?: DetoxAction;
  while?: ExpectationInvocation;
}
//#endregion Base Invocations

//#region Web Invocations
interface BaseWebInvocation extends BaseInvocation {
  webPredicate?: WebPredicate;
  webAtIndex?: number;
}

interface BaseWebActionInvocation extends BaseWebInvocation {
  type?: 'webAction';
  webAction?: WebAction;
}

interface BaseWebExpectationInvocation extends BaseWebInvocation {
  type?: 'webExpectation';
  webExpectation?: WebExpectation;
  webModifiers?: ExpectationModifier[];
}

export interface WebGetTitleAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'getTitle';
}

export interface WebGetCurrentUrlAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'getCurrentUrl';
}

export interface WebScrollToViewAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'scrollToView';
}

export interface WebTapAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'tap';
}

export interface WebTextAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction?:
    | 'clearText'
    | 'focus'
    | 'moveCursorToEnd'
    | 'replaceText'
    | 'selectAllText'
    | 'typeText';
  params?: WebTextActionParams;
}

export interface WebGetTextAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'getText';
}

export interface WebScriptAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'runScript';
  params?: WebScriptParams;
}

export interface WebScriptWithArgsAction extends BaseWebActionInvocation {
  type: 'webAction';
  webAction: 'runScriptWithArgs';
  params?: WebScriptWithArgsParams;
}

export interface WebExpectationInvocation extends BaseWebExpectationInvocation {
  type: 'webExpectation';
  webExpectation: WebExpectation;
  params?: readonly [expected?: string];
}
//#endregion Web Invocations

//#region System Invocations
export interface SystemActionMessage {
  type: 'systemAction';
  systemAction?: string;
  systemPredicate?: Predicate;
  systemAtIndex?: number;
}

export interface SystemExpectationMessage {
  type: 'systemExpectation';
  systemExpectation?: string;
  systemPredicate?: Predicate;
  systemAtIndex?: number;
  systemModifiers?: ExpectationModifier[];
  params?: readonly [expected?: string];
}
//#endregion System Invocations

//#region Action Invocations
export interface TapAction extends BaseActionInvocation {
  action: 'tap';
}

export interface LongPressAction extends BaseActionInvocation {
  action: 'longPress';
  params: LongPressParams;
}

export interface ScrollAction extends BaseActionInvocation {
  action: 'scroll';
  params: ScrollParams;
}

export interface ScrollToAction extends BaseActionInvocation {
  action: 'scrollTo';
  params: ScrollToParams;
}

export interface ReplaceTextAction extends BaseActionInvocation {
  action: 'replaceText';
  params: TextParams;
}

export interface TypeTextAction extends BaseActionInvocation {
  action: 'typeText';
  params: TextParams;
}

export interface AccessibilityAction extends BaseActionInvocation {
  action: 'accessibilityAction';
  params: AccessibilityActionParams;
}

export interface SetDatePickerAction extends BaseActionInvocation {
  action: 'setDatePickerDate';
  params: DatePickerParams;
}

export interface SwipeAction extends BaseActionInvocation {
  action: 'swipe';
  params: SwipeParams;
}

export interface SetColumnAction extends BaseActionInvocation {
  action: 'setColumnToValue';
  params: PickerColumnParams;
}

export interface MultiTapAction extends BaseActionInvocation {
  action: 'multiTap';
  params: MultiTapParams;
}

export interface TakeScreenshotAction extends BaseActionInvocation {
  action: 'takeScreenshot';
  params: TakeScreenshotParams;
}
//#endregion Action Invocations

//#region Invocation Union Types
export type ActionInvocation =
  | TapAction
  | LongPressAction
  | ScrollAction
  | ScrollToAction
  | ReplaceTextAction
  | TypeTextAction
  | AccessibilityAction
  | SetDatePickerAction
  | SwipeAction
  | SetColumnAction
  | MultiTapAction
  | TakeScreenshotAction;

export type WebInvocation =
  | WebGetTitleAction
  | WebGetCurrentUrlAction
  | WebScrollToViewAction
  | WebTapAction
  | WebTextAction
  | WebGetTextAction
  | WebScriptAction
  | WebScriptWithArgsAction;

export type Invocation =
  | ActionInvocation
  | ExpectationInvocation
  | WebInvocation
  | WebExpectationInvocation;
//#endregion Invocation Union Types

//#region Action Params
export type ScrollParams = readonly [distance: number, direction: ScrollDirection];
export type ScrollToParams = readonly [
  edge: ScrollEdge,
  normalizedX?: number,
  normalizedY?: number,
];
export type LongPressParams = readonly [duration: number];
export type TextParams = readonly [text: string];
export type DatePickerParams = readonly [date: string, format?: string];
export type AccessibilityActionParams = readonly [action: string];
export type SwipeParams = readonly [direction: string, speed: string, percentage: number];
export type PickerColumnParams = readonly [column: number, value: string];
export type MultiTapParams = readonly [count: number];
export type TakeScreenshotParams = readonly [name: string];

export type ActionParams =
  | AccessibilityActionParams
  | DatePickerParams
  | LongPressParams
  | MultiTapParams
  | PickerColumnParams
  | ScrollParams
  | ScrollToParams
  | SwipeParams
  | TextParams;
//#endregion Action Params

//#region Web Params
export type WebTextActionParams = readonly [text: string];
export type WebScriptParams = readonly [script: string];
export type WebScriptWithArgsParams = readonly [script: string, args: unknown[]];

export type WebActionParams = WebTextActionParams | WebScriptParams | WebScriptWithArgsParams;
//#endregion Web Params

//#region Messages
export interface InvokeMessage {
  type: 'invoke';
  params?: Invocation;
}

export interface DeliverPayloadMessage {
  type: 'deliverPayload';
  params?: DeliverPayloadParams;
}

export interface DeliverPayloadParams {
  url?: string;
  delayPayload?: boolean;
  viewHierarchyURL?: string;
  detoxUserActivityDataURL?: string;
  detoxUserNotificationDataURL?: string;
  newInstance?: boolean;
  shouldInjectTestIds?: boolean;
}
//#endregion Messages
