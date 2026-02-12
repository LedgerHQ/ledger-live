import { element, by, waitFor } from "detox";
import { Direction, NativeElement, NativeMatcher } from "detox/detox";
import { delay, isAndroid } from "./commonHelpers";

const MAX_ATTEMPTS_PER_DIRECTION = 10;
const SCROLL_STALL_THRESHOLD = 7;
const ANDROID_SCROLL_DELAY = 500;

export class PageScroller {
  async performScroll(
    matcher: NativeMatcher,
    scrollViewId?: string | RegExp,
    pixels = 300,
    initialDirection: Direction = "down",
    timeout = ANDROID_SCROLL_DELAY,
  ): Promise<void> {
    if (await this.isVisible(matcher, timeout)) {
      return;
    }

    const scrollContainer = await this.getScrollElement(scrollViewId);

    let direction = initialDirection;
    let stallCount = 0;
    let bottomReached = false;
    let topReached = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_DIRECTION * 2; attempt++) {
      await this.scrollOnce(scrollContainer, direction, pixels);

      if (await this.isVisible(matcher, timeout)) {
        await this.waitForScrollToSettle();
        return;
      }

      const decision = this.decideNextDirection(direction, stallCount, bottomReached, topReached);
      direction = decision.nextDirection;
      bottomReached = decision.bottomReached;
      topReached = decision.topReached;
      stallCount = decision.resetStall ? 0 : stallCount + 1;

      if (bottomReached && topReached) {
        break;
      }
    }

    throw new Error(`Failed to find element after scrolling. Matcher: ${JSON.stringify(matcher)}`);
  }

  private async isVisible(matcher: NativeMatcher, timeout: number): Promise<boolean> {
    try {
      await waitFor(element(matcher).atIndex(0)).toBeVisible().withTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async getScrollElement(
    scrollViewId?: string | RegExp,
  ): Promise<Detox.IndexableNativeElement | NativeElement> {
    if (scrollViewId) {
      const scrollElement = by.id(scrollViewId);
      if (await this.isVisible(scrollElement, 2000)) {
        return element(scrollElement);
      } else {
        throw new Error(`Scroll view with id ${scrollViewId} not found or not visible.`);
      }
    }
    const type = isAndroid() ? "android.widget.ScrollView" : "RCTEnhancedScrollView";
    return element(by.type(type)).atIndex(0);
  }

  private async scrollOnce(
    scrollContainer: Detox.IndexableNativeElement | Detox.NativeElement,
    direction: Direction,
    pixels: number,
  ): Promise<void> {
    const isHorizontal = direction === "left" || direction === "right";
    const useSwipeForAndroidHorizontal = isAndroid() && isHorizontal;

    if (useSwipeForAndroidHorizontal) {
      const swipeDirection = direction === "right" ? "left" : "right";
      return await scrollContainer.swipe(swipeDirection, "fast", 0.85);
    }

    try {
      switch (direction) {
        case "down":
          return await scrollContainer.scroll(pixels, "down", NaN, 0.8);
        case "up":
          return await scrollContainer.scroll(pixels, "up", NaN, 0.8);
        case "right":
          return await scrollContainer.scroll(pixels, "right", NaN, 0.5);
        case "left":
          return await scrollContainer.scroll(pixels, "left", NaN, 0.5);
        case "bottom":
          return await scrollContainer.swipe("up", "fast");
        default:
          throw new Error(`Unsupported scroll direction: ${direction}`);
      }
    } catch {
      const fallbackDirection = isHorizontal
        ? direction === "right"
          ? "left"
          : "right"
        : direction === "down"
          ? "up"
          : "down";
      return await scrollContainer.swipe(fallbackDirection, "slow");
    }
  }

  private decideNextDirection(
    currentDirection: Direction,
    stallCount: number,
    bottomReached: boolean,
    topReached: boolean,
  ): {
    nextDirection: Direction;
    bottomReached: boolean;
    topReached: boolean;
    resetStall: boolean;
  } {
    if (stallCount >= SCROLL_STALL_THRESHOLD) {
      let flipped: Direction;

      if (currentDirection === "down") {
        flipped = "up";
        bottomReached = true;
      } else if (currentDirection === "up") {
        flipped = "bottom";
        topReached = true;
      } else if (currentDirection === "bottom") {
        flipped = "up";
      } else if (currentDirection === "right") {
        flipped = "left";
        bottomReached = true;
      } else if (currentDirection === "left") {
        flipped = "right";
        topReached = true;
      } else {
        flipped = "down";
      }

      return {
        nextDirection: flipped,
        bottomReached,
        topReached,
        resetStall: true,
      };
    }

    return {
      nextDirection: currentDirection,
      bottomReached,
      topReached,
      resetStall: false,
    };
  }

  async waitForScrollToSettle(): Promise<void> {
    await delay(1_000);
  }
}
