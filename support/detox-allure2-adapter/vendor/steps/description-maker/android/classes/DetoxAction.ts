import { StepDescriptionFriendly } from '../../types';
import {
  AccessibilityActionResult,
  AdjustSliderToPositionResult,
  GetAttributesResult,
  LongPressResult,
  LongPressAndDragResult,
  MultiClickResult,
  ScrollInDirectionResult,
  ScrollInDirectionStaleAtEdgeResult,
  ScrollToEdgeResult,
  ScrollToIndexResult,
  SetDatePickerDateResult,
  SwipeInDirectionResult,
  TakeViewScreenshotResult,
  TapAtLocationResult,
} from './DetoxActionResults';

export class DetoxAction {
  static scrollInDirection(
    direction: string | number,
    amountInDP: number,
    startOffsetPercentX: number,
    startOffsetPercentY: number,
  ) {
    return new ScrollInDirectionResult(
      direction,
      amountInDP,
      startOffsetPercentX,
      startOffsetPercentY,
    );
  }

  static longPress(x?: number, y?: number, duration?: number) {
    return new LongPressResult(x, y, duration);
  }

  static swipeInDirection(
    direction: string,
    fast: boolean,
    normalizedOffset: number,
    normalizedStartingPointX: number,
    normalizedStartingPointY: number,
  ) {
    return new SwipeInDirectionResult(
      direction,
      fast,
      normalizedOffset,
      normalizedStartingPointX,
      normalizedStartingPointY,
    );
  }

  static multiClick(times: number) {
    return new MultiClickResult(times);
  }

  static tapAtLocation(x: number, y: number) {
    return new TapAtLocationResult(x, y);
  }

  static createCoordinatesProvider(x: number, y: number) {
    return new TapAtLocationResult(x, y); // Reuse tap location for coordinates
  }

  static scrollToEdge(edge: number, startOffsetPercentX: number, startOffsetPercentY: number) {
    return new ScrollToEdgeResult(edge, startOffsetPercentX, startOffsetPercentY);
  }

  static scrollInDirectionStaleAtEdge(
    direction: number,
    amountInDP: number,
    startOffsetPercentX: number,
    startOffsetPercentY: number,
  ) {
    return new ScrollInDirectionStaleAtEdgeResult(
      direction,
      amountInDP,
      startOffsetPercentX,
      startOffsetPercentY,
    );
  }

  static getAttributes() {
    return new GetAttributesResult();
  }

  static scrollToIndex(index: number) {
    return new ScrollToIndexResult(index);
  }

  static setDatePickerDate(dateString: string, formatString: string) {
    return new SetDatePickerDateResult(dateString, formatString);
  }

  static adjustSliderToPosition(newPosition: number) {
    return new AdjustSliderToPositionResult(newPosition);
  }

  static longPressAndDrag(
    duration: number,
    normalizedPositionX: number,
    normalizedPositionY: number,
    targetElement: StepDescriptionFriendly,
    normalizedTargetPositionX: number,
    normalizedTargetPositionY: number,
    isFast: boolean,
    holdDuration: number,
  ) {
    return new LongPressAndDragResult(
      duration,
      normalizedPositionX,
      normalizedPositionY,
      targetElement,
      normalizedTargetPositionX,
      normalizedTargetPositionY,
      isFast,
      holdDuration,
    );
  }

  static takeViewScreenshot() {
    return new TakeViewScreenshotResult();
  }

  static accessibilityAction(actionName: string) {
    return new AccessibilityActionResult(actionName);
  }
}
