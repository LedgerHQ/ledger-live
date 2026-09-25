import { StepDescription, StepDescriptionFriendly } from '../../types';
import type { ArgumentFormatter } from '../core';
export declare class ViewActions {
    static clearText(): ClearTextResult;
    static pressKey(keyCode: number): PressKeyResult;
    static replaceText(stringToBeSet: string): ReplaceTextResult;
    static clearGlobalAssertions(): ClearGlobalAssertionsResult;
    static actionWithAssertions(viewAction: ArgumentFormatter): ActionWithAssertionsResult;
    static click(inputDevice?: string, buttonState?: string): ClickResult;
    static swipeLeft(): SwipeResult;
    static swipeRight(): SwipeResult;
    static swipeDown(): SwipeResult;
    static swipeUp(): SwipeResult;
    static closeSoftKeyboard(): KeyboardActionResult;
    static pressImeActionButton(): KeyboardActionResult;
    static pressBack(): KeyboardActionResult;
    static pressBackUnconditionally(): KeyboardActionResult;
    static pressMenuKey(): KeyboardActionResult;
    static doubleClick(): DoubleClickResult;
    static longClick(duration?: number): LongClickResult;
    static scrollTo(direction?: string): ScrollToResult;
    static typeTextIntoFocusedView(stringToBeTyped: string): TypeTextResult;
    static typeText(stringToBeTyped: string): TypeTextResult;
    static openLinkWithText(linkText: string): OpenLinkResult;
    static openLinkWithUri(uri: string): OpenLinkResult;
    static repeatedlyUntil(action: ArgumentFormatter, desiredStateMatcher: StepDescriptionFriendly, maxAttempts: number): RepeatedlyUntilResult;
    static swipe(direction: string, speed?: string): SwipeResult;
}
export declare class ClearTextResult implements ArgumentFormatter {
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class PressKeyResult implements ArgumentFormatter {
    private readonly keyCode;
    constructor(keyCode: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ReplaceTextResult implements ArgumentFormatter {
    private readonly text;
    constructor(text: string);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ClearGlobalAssertionsResult implements ArgumentFormatter {
    format(): StepDescription;
}
export declare class ActionWithAssertionsResult implements ArgumentFormatter {
    private readonly action;
    constructor(action: ArgumentFormatter);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ClickResult implements ArgumentFormatter {
    private readonly inputDevice?;
    private readonly buttonState?;
    constructor(inputDevice?: string | undefined, buttonState?: string | undefined);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class SwipeResult implements ArgumentFormatter {
    private readonly direction;
    private readonly speed?;
    constructor(direction: string, speed?: string | undefined);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class KeyboardActionResult implements ArgumentFormatter {
    private readonly action;
    constructor(action: string);
    format(): StepDescription;
}
export declare class DoubleClickResult implements ArgumentFormatter {
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class LongClickResult implements ArgumentFormatter {
    private readonly duration?;
    constructor(duration?: number | undefined);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ScrollToResult implements ArgumentFormatter {
    private readonly direction?;
    constructor(direction?: string | undefined);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class TypeTextResult implements ArgumentFormatter {
    private readonly text;
    private readonly isFocused;
    constructor(text: string, isFocused?: boolean);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class OpenLinkResult implements ArgumentFormatter {
    private readonly type;
    private readonly value;
    constructor(type: 'text' | 'uri', value: string);
    format(): StepDescription;
}
export declare class RepeatedlyUntilResult implements ArgumentFormatter {
    private readonly action;
    private readonly desiredStateMatcher;
    private readonly maxAttempts;
    constructor(action: ArgumentFormatter, desiredStateMatcher: StepDescriptionFriendly, maxAttempts: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
