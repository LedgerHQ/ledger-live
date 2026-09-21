import { useSelector } from "react-redux";
import { selectCardAuthStatus } from "../state/selectors";
import type { PayCardAuthStatus } from "../state/types";

/**
 * Where the Card session stands, for hosts that compose the Card flow around it. Unlike
 * {@link useIsCardSignedIn}, this tells "still resolving" (`unknown`) from "signed out", so a host
 * can hold the login CTA back until the login machine has hydrated the stored session.
 */
export function useCardAuthStatus(): PayCardAuthStatus {
  return useSelector(selectCardAuthStatus);
}
