/**
 * @module analytics/flowTracker
 * @description
 * Tracks one multi-screen flow with its own page stack, so a drawer or another screen of the app
 * cannot change the `page` and `source` of the flow's events.
 *
 * @example
 * ```ts
 * const flow = createFlowTracker({ props: () => ({ sourceFlow: "onboarding" }) });
 *
 * flow.page("Genuine Check");
 * flow.click("Initiate Genuine Check"); // page: "Genuine Check"
 * flow.openDrawer("Drawer : Error");
 * flow.closeDrawer(); // back on "Genuine Check"
 * flow.start("onboarding_started");
 * flow.end("onboarding_done"); // sent once per attempt
 * ```
 */

import { getCurrentTrackingPage, setTrackingSource } from "./screenRefs";
import { track } from "./track";
import { trackPage } from "./trackPage";
import type { Props } from "./types";

type Screen = Readonly<{ name: string; source: string }>;

export type FlowTrackerOptions = Readonly<{
  /** Properties sent on every event of the flow, read when each event is sent. */
  props?: () => Props;
}>;

export type FlowTracker = Readonly<{
  /** Shows a screen. Showing the current screen again sends nothing. Closes open drawers. */
  page: (name: string, props?: Props) => void;
  /** Shows a drawer over the current screen. */
  openDrawer: (name: string, props?: Props) => void;
  /** Closes the top drawer: the screen under it is the current page again. */
  closeDrawer: () => void;
  /** Sends `button_clicked` on the current page. */
  click: (button: string, props?: Props) => void;
  /** Sends the start event, once per attempt. */
  start: (event: string, props?: Props) => void;
  /** Sends the end event, once per attempt. Later ends are ignored. */
  end: (event: string, props?: Props) => void;
  /** Ends the attempt without an end event. */
  cancel: () => void;
  /** Starts a new attempt: clears the pages, the start and the end. */
  reset: () => void;
  hasStarted: () => boolean;
  hasEnded: () => boolean;
  currentPage: () => string | null;
}>;

const sourceOf = (at: Screen | null): Props => (at?.source ? { source: at.source } : {});

export function createFlowTracker({ props = () => ({}) }: FlowTrackerOptions = {}): FlowTracker {
  let screen: Screen | null = null;
  let drawers: Screen[] = [];
  let started = false;
  let ended = false;

  const top = (): Screen | null => drawers.at(-1) ?? screen;
  const where = (at: Screen | null): Props => (at ? { page: at.name, ...sourceOf(at) } : {});

  const show = (next: Screen, extra: Props) => {
    send(
      trackPage(
        { category: next.name, props: { ...props(), ...extra, ...sourceOf(next) } },
        { updateRoutes: true, refreshSource: true },
      ),
    );
  };

  const event = (name: string, extra: Props) => {
    send(track(name, { ...props(), ...extra, ...where(top()) }));
  };

  return {
    page: (name, extra = {}) => {
      drawers = [];
      if (screen?.name === name) return;
      screen = { name, source: screen?.name ?? getCurrentTrackingPage() };
      show(screen, extra);
    },
    openDrawer: (name, extra = {}) => {
      const drawer = { name, source: top()?.name ?? "" };
      drawers = [...drawers, drawer];
      show(drawer, extra);
    },
    closeDrawer: () => {
      if (drawers.length === 0) return;
      drawers = drawers.slice(0, -1);
      const current = top();
      if (current) setTrackingSource(current.name);
    },
    click: (button, extra = {}) => event("button_clicked", { ...extra, button }),
    start: (name, extra = {}) => {
      if (started || ended) return;
      started = true;
      event(name, extra);
    },
    end: (name, extra = {}) => {
      if (ended) return;
      ended = true;
      event(name, extra);
    },
    cancel: () => {
      ended = true;
    },
    reset: () => {
      screen = null;
      drawers = [];
      started = false;
      ended = false;
    },
    hasStarted: () => started,
    hasEnded: () => ended,
    currentPage: () => top()?.name ?? null,
  };
}

/** Fire and forget: delivery failures are already reported on `analyticsEvents$`. */
function send(delivery: void | Promise<void>): void {
  Promise.resolve(delivery).catch(() => undefined);
}
