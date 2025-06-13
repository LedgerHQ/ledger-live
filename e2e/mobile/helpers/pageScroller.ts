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

    const scrollContainer = this.getScrollElement(scrollViewId);

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

  private getScrollElement(
    scrollViewId?: string | RegExp,
  ): Detox.IndexableNativeElement | NativeElement {
    if (scrollViewId) {
      return element(by.id(scrollViewId));
    }
    const type = isAndroid() ? "android.widget.ScrollView" : "RCTScrollView";
    return element(by.type(type)).atIndex(0);
  }

  private async scrollOnce(
    scrollContainer: Detox.IndexableNativeElement | Detox.NativeElement,
    direction: Direction,
    pixels: number,
  ): Promise<void> {
    if (direction === "bottom") {
      return scrollContainer.swipe("up", "fast");
    } else if (direction === "down") {
      return scrollContainer.scroll(pixels, direction, NaN, 0.8);
    } else {
      return scrollContainer.swipe("down", "fast");
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
      const flipped = currentDirection === "down" ? "up" : "down";
      return {
        nextDirection: flipped,
        bottomReached: currentDirection === "down" ? true : bottomReached,
        topReached: currentDirection === "up" ? true : topReached,
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
