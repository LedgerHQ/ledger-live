/**
 * Component to prime the React Native Modal system on app startup.
 *
 * This fixes a layout calculation bug on android where modals don't
 * render correctly on their first open. By opening and immediately
 * closing a dummy modal, we initialize the Modal system's state.
 */
// Startup diagnostic branch: no dummy modal at startup, to measure what the priming costs.
export const ModalSystemPrimer = () => null;
