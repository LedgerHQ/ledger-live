import { useSelector } from "react-redux";
import { selectIsSignedIn } from "../state/slice";

/** True while a Card session is live, for hosts that compose the Card flow around it. */
export function useIsCardSignedIn(): boolean {
  return useSelector(selectIsSignedIn);
}
