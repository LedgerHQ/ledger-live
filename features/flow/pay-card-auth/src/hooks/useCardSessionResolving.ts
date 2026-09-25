import { useSelector } from "react-redux";
import { selectIsCardSessionResolving } from "../state/selectors";

/**
 * True while the login machine still works towards a resolved session: it hydrates the stored one,
 * or it trades a redirect for a token. {@link useCardAuthStatus} cannot say it on its own, because
 * a fresh login runs its whole round trip while the status reads `signedOut`.
 */
export function useCardSessionResolving(): boolean {
  return useSelector(selectIsCardSessionResolving);
}
