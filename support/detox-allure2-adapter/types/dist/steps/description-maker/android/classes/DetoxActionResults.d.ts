import { StepDescription, StepDescriptionFriendly } from '../../types';
import type { ArgumentFormatter } from '../core';
export declare class AccessibilityActionResult implements ArgumentFormatter {
    private readonly actionName;
    constructor(actionName: string);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class AdjustSliderToPositionResult implements ArgumentFormatter {
    private readonly position;
    constructor(position: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class GetAttributesResult implements ArgumentFormatter {
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class LongPressResult implements ArgumentFormatter {
    private readonly x?;
    private readonly y?;
    private readonly duration?;
    constructor(x?: number | undefined, y?: number | undefined, duration?: number | undefined);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ScrollInDirectionResult implements ArgumentFormatter {
    private readonly amountInDP;
    private readonly startOffsetPercentX;
    private readonly startOffsetPercentY;
    private static readonly DIRECTIONS;
    private readonly direction;
    constructor(direction: string | number, amountInDP: number, startOffsetPercentX: number, startOffsetPercentY: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ScrollInDirectionStaleAtEdgeResult implements ArgumentFormatter {
    private readonly amountInDP;
    private readonly startOffsetPercentX;
    private readonly startOffsetPercentY;
    private static readonly DIRECTIONS;
    private readonly direction;
    constructor(direction: number, amountInDP: number, startOffsetPercentX: number, startOffsetPercentY: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ScrollToEdgeResult implements ArgumentFormatter {
    private readonly edge;
    private readonly startOffsetPercentX;
    private readonly startOffsetPercentY;
    constructor(edge: number, startOffsetPercentX: number, startOffsetPercentY: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class ScrollToIndexResult implements ArgumentFormatter {
    private readonly index;
    constructor(index: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class SetDatePickerDateResult implements ArgumentFormatter {
    private readonly dateString;
    private readonly formatString;
    constructor(dateString: string, formatString: string);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class SwipeInDirectionResult implements ArgumentFormatter {
    private readonly direction;
    private readonly fast;
    private readonly normalizedOffset;
    private readonly normalizedStartingPointX;
    private readonly normalizedStartingPointY;
    constructor(direction: string, fast: boolean, normalizedOffset: number, normalizedStartingPointX: number, normalizedStartingPointY: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class TakeViewScreenshotResult implements ArgumentFormatter {
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class MultiClickResult implements ArgumentFormatter {
    private readonly times;
    constructor(times: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class TapAtLocationResult implements ArgumentFormatter {
    private readonly x;
    private readonly y;
    constructor(x: number, y: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
export declare class LongPressAndDragResult implements ArgumentFormatter {
    private readonly duration;
    private readonly normalizedPositionX;
    private readonly normalizedPositionY;
    private readonly targetElement;
    private readonly normalizedTargetPositionX;
    private readonly normalizedTargetPositionY;
    private readonly isFast;
    private readonly holdDuration;
    constructor(duration: number, normalizedPositionX: number, normalizedPositionY: number, targetElement: StepDescriptionFriendly, normalizedTargetPositionX: number, normalizedTargetPositionY: number, isFast: boolean, holdDuration: number);
    format(matcher: StepDescriptionFriendly): StepDescription;
}
