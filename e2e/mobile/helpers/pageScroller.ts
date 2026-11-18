import { element, by, waitFor, log } from "detox";
import { Direction, NativeElement, NativeMatcher } from "detox/detox";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { delay, isAndroid } from "@e2e/helpers/commonHelpers";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";
import { isHardTimeout, waitHardTimeout, withHardTimeout } from "@e2e/helpers/elements/hardTimeout";

const MAX_ATTEMPTS_PER_DIRECTION = 10;
const SCROLL_STALL_THRESHOLD = 7;

// A swipe is the inverse gesture of the scroll it produces: revealing content below is
// scroll "down" but swipe "up".
const swipeDirectionFor = (direction: Direction): Direction => {
  switch (direction) {
    case "up":
      return "down";
    case "right":
      return "left";
    case "left":
      return "right";
    default:
      return "up";
  }
};

/**
 * Builds the element to check on every call, at the match index its element handle uses.
 * A fresh element each time: Android's atIndex mutates the matcher it wraps.
 */
export type ElementFactory = () => NativeElement;

type ScrollTarget = NativeMatcher | ElementFactory;

const toElement = (target: ScrollTarget): NativeElement =>
  typeof target === "function" ? target() : element(target).atIndex(0);

const describeTarget = (target: ScrollTarget): string =>
  typeof target === "function" ? "the element handle" : JSON.stringify(target);

export class PageScroller {
  async performScroll(
    target: ScrollTarget,
    scrollView?: string | RegExp | ScrollTarget,
    pixels = 300,
    initialDirection: Direction = "down",
    timeout = TIMEOUT.xxxsmall,
  ): Promise<void> {
    if (await this.isVisible(target, timeout)) {
      return;
    }

    const scrollContainer = await this.getScrollElement(scrollView);

    let direction = initialDirection;
    let stallCount = 0;
    let bottomReached = false;
    let topReached = false;

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_DIRECTION * 2; attempt++) {
      await this.scrollOnce(scrollContainer, direction, pixels);

      if (await this.isVisible(target, timeout)) {
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

    throw new Error(`Failed to find element after scrolling. Matcher: ${describeTarget(target)}`);
  }

  /**
   * Performs a single fixed scroll of a given amount of pixels, without targeting any element.
   * Useful to add extra "slack" so a located element is not stuck at the edge of the viewport
   * (e.g. hidden behind a sticky footer) before interacting with it.
   */
  async scrollByPixels(
    scrollViewId: string | RegExp | ScrollTarget | undefined,
    pixels: number,
    direction: Direction = "down",
  ): Promise<void> {
    const scrollContainer = await this.getScrollElement(scrollViewId);
    await this.scrollOnce(scrollContainer, direction, pixels);
    await this.waitForScrollToSettle();
  }

  private async isVisible(target: ScrollTarget, timeout: number): Promise<boolean> {
    try {
      await withHardTimeout(
        waitFor(toElement(target)).toBeVisible().withTimeout(timeout),
        waitHardTimeout(timeout),
      );
      return true;
    } catch (error) {
      if (isHardTimeout(error)) throw error;
      return false;
    }
  }

  private async getScrollElement(
    scrollView?: string | RegExp | ScrollTarget,
  ): Promise<Detox.IndexableNativeElement | NativeElement> {
    if (scrollView) {
      // string | RegExp | NativeMatcher serve the elementHelpers.ts globals: keep only
      // ElementFactory once that file is deleted.
      const scrollTarget =
        typeof scrollView === "string" || scrollView instanceof RegExp
          ? by.id(scrollView)
          : scrollView;
      if (await this.isVisible(scrollTarget, TIMEOUT.xsmall)) {
        return typeof scrollTarget === "function" ? scrollTarget() : element(scrollTarget);
      } else {
        const name =
          scrollTarget === scrollView ? describeTarget(scrollTarget) : `with id ${scrollView}`;
        throw new Error(`Scroll view ${name} not found or not visible.`);
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
    const swipeDirection = swipeDirectionFor(direction);

    if (isAndroid() && isHorizontal) {
      return await withHardTimeout(scrollContainer.swipe(swipeDirection, "fast", 0.85));
    }

    try {
      switch (direction) {
        case "down":
          return await withHardTimeout(scrollContainer.scroll(pixels, "down", Number.NaN, 0.8));
        case "up":
          return await withHardTimeout(scrollContainer.scroll(pixels, "up", Number.NaN, 0.8));
        case "right":
          return await withHardTimeout(scrollContainer.scroll(pixels, "right", Number.NaN, 0.5));
        case "left":
          return await withHardTimeout(scrollContainer.scroll(pixels, "left", Number.NaN, 0.5));
        case "bottom":
          return await withHardTimeout(scrollContainer.swipe(swipeDirection, "fast"));
        default:
          throw new Error(`Unsupported scroll direction: ${direction}`);
      }
    } catch (error) {
      if (isHardTimeout(error)) throw error;
      log.warn(
        `scroll ${direction} failed, falling back to swipe ${swipeDirection}: ${sanitizeError(error)}`,
      );
      return await withHardTimeout(scrollContainer.swipe(swipeDirection, "slow"));
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
    await delay(INTERVAL.medium);
  }
}
