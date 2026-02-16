/**
 * Temporary E2E hack: re-export react-router with useNavigate wrapped to add 1s delay
 * on every navigation. Remove when tests use proper waits.
 * (Used via rspack alias "react-router" -> this file in renderer only.)
 */
import * as RR from "react-router-original";

const DELAY_MS = 1000;

type NavigateFn = ReturnType<typeof RR.useNavigate>;

function useNavigate(...args: Parameters<typeof RR.useNavigate>): NavigateFn {
  const navigate = RR.useNavigate(...args);
  const delayedNavigate: NavigateFn = (to, options) => {
    setTimeout(() => navigate(to, options), DELAY_MS);
  };
  return delayedNavigate;
}

export * from "react-router-original";
export { useNavigate };
