import { StepDescriptionFriendly } from '../../types';
import { AccessibilityActionResult, AdjustSliderToPositionResult, GetAttributesResult, LongPressResult, LongPressAndDragResult, MultiClickResult, ScrollInDirectionResult, ScrollInDirectionStaleAtEdgeResult, ScrollToEdgeResult, ScrollToIndexResult, SetDatePickerDateResult, SwipeInDirectionResult, TakeViewScreenshotResult, TapAtLocationResult } from './DetoxActionResults';
export declare class DetoxAction {
    static scrollInDirection(direction: string | number, amountInDP: number, startOffsetPercentX: number, startOffsetPercentY: number): ScrollInDirectionResult;
    static longPress(x?: number, y?: number, duration?: number): LongPressResult;
    static swipeInDirection(direction: string, fast: boolean, normalizedOffset: number, normalizedStartingPointX: number, normalizedStartingPointY: number): SwipeInDirectionResult;
    static multiClick(times: number): MultiClickResult;
    static tapAtLocation(x: number, y: number): TapAtLocationResult;
    static createCoordinatesProvider(x: number, y: number): TapAtLocationResult;
    static scrollToEdge(edge: number, startOffsetPercentX: number, startOffsetPercentY: number): ScrollToEdgeResult;
    static scrollInDirectionStaleAtEdge(direction: number, amountInDP: number, startOffsetPercentX: number, startOffsetPercentY: number): ScrollInDirectionStaleAtEdgeResult;
    static getAttributes(): GetAttributesResult;
    static scrollToIndex(index: number): ScrollToIndexResult;
    static setDatePickerDate(dateString: string, formatString: string): SetDatePickerDateResult;
    static adjustSliderToPosition(newPosition: number): AdjustSliderToPositionResult;
    static longPressAndDrag(duration: number, normalizedPositionX: number, normalizedPositionY: number, targetElement: StepDescriptionFriendly, normalizedTargetPositionX: number, normalizedTargetPositionY: number, isFast: boolean, holdDuration: number): LongPressAndDragResult;
    static takeViewScreenshot(): TakeViewScreenshotResult;
    static accessibilityAction(actionName: string): AccessibilityActionResult;
}
