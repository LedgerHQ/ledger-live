/**
 * Timing for the two OnboardModal suites — the single source of truth for both.
 *
 * This module deliberately has no imports. A `jest.mock` factory is hoisted above the
 * import block, so it cannot close over an imported binding; it can only reach a value
 * through `jest.requireActual` when the mocked module is first required. That is safe for
 * a leaf module like this one, but not for `./testUtils`, which pulls in the coin module
 * and wallet framework. Keep it dependency-free.
 *
 *   jest.mock("../constants", () => ({
 *     STEP_TRANSITION_TIMEOUT: jest.requireActual("./timing").STEP_TRANSITION_TIMEOUT_TEST,
 *   }));
 */

/**
 * What both suites mock `../constants` STEP_TRANSITION_TIMEOUT down to.
 *
 * Production debounces each step transition by 1500ms so the user can read the screen it
 * reveals. That debounce is also what holds the transient screens the suites assert on —
 * the confirmation-code screen, for instance, lives exactly one debounce before the
 * bridge's next status replaces it — so it can come down but not to zero. At 1500ms the
 * nine flows across the two suites spent ~24s of the run idling.
 */
export const STEP_TRANSITION_TIMEOUT_TEST = 250;

/** When the mocked observables report their first progress status. */
export const PROGRESS_DELAY = 10;

/**
 * How long the assertions get on a transient screen before the terminal emit replaces it.
 * Generous on purpose: this is the margin that absorbs scheduling jitter on a loaded CI
 * runner, and it is the only thing standing between these suites and a real-time race.
 */
const ASSERTION_MARGIN = 150;

/**
 * When the mocked observables / device calls emit their terminal value.
 *
 * Derived, not chosen: a terminal emit cancels a step transition that is still pending, so
 * an emit landing before `PROGRESS_DELAY + STEP_TRANSITION_TIMEOUT_TEST` skips the
 * intermediate screen the suites assert on entirely. Deriving it keeps that invariant true
 * if the transition timeout above is ever retuned.
 */
export const EMIT_DELAY = PROGRESS_DELAY + STEP_TRANSITION_TIMEOUT_TEST + ASSERTION_MARGIN;

/** Ceiling for the async assertions, not a cost: nothing in these suites should approach it. */
export const WAIT_OPTS = { timeout: 5_000 };
