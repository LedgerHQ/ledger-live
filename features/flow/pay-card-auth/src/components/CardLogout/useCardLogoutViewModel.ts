import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetUserQuery } from "@domain/api-card-management";
import type { PayCardUser } from "@domain/api-card-management";
import { createCardLogoutPorts } from "../../state/createCardLogoutPorts";
import type { CardLoginDispatch } from "../../state/createCardLoginPorts";
import { selectIsSignedIn } from "../../state/slice";
import type { CardLogoutPorts } from "../../state/types";
import type { CardLogoutViewModel } from "./types";

/** Hardcoded English until the Pay tab gets its copy keys. */
const VERIFICATION_LABELS: Record<PayCardUser["verificationState"], string> = {
  UNVERIFIED: "Not verified",
  PENDING: "In review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

/**
 * Ends the session, in the order the login machine used before the two components split.
 *
 * Best effort by design, and the caller never has to handle a failure: a provider that refuses to end
 * its own session must not keep the user signed in here, and a session left behind heals itself,
 * because the next request answers 401 and the base query clears it.
 */
export async function runLogout(ports: CardLogoutPorts): Promise<void> {
  await ports.logout().catch(() => undefined);

  try {
    await ports.clearSession();
  } catch {
    // Nothing to hand back. The flag below already ends the session for this process.
  } finally {
    // These run even when the session store refuses. A user left in the Card cache would keep every
    // other screen showing whoever just logged out.
    await ports.clearAttempt().catch(() => undefined);
    ports.forgetUser();
    ports.setSignedIn(false);
  }
}

/**
 * Turns the signed-in flag, plus the user in the cache, into the view props. Pure, so the mapping can
 * be read and tested without a React tree.
 */
export function mapUserToViewModel(
  isSignedIn: boolean,
  user: PayCardUser | undefined,
  isLoading: boolean,
  onLogoutPress: () => void,
): CardLogoutViewModel {
  // Nobody is signed in, or the user answer is still on its way back from the cache.
  if (!isSignedIn || !user) {
    return null;
  }

  return {
    title: "Card",
    idLabel: "Account",
    userId: user.id,
    verificationLabel: "Verification",
    verificationValue: VERIFICATION_LABELS[user.verificationState],
    logoutLabel: "Log out",
    isLoading,
    onLogoutPress,
  };
}

export function useCardLogoutViewModel(): CardLogoutViewModel {
  const dispatch = useDispatch<CardLoginDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const [isLoading, setIsLoading] = useState(false);

  const ports = useMemo(() => createCardLogoutPorts(dispatch), [dispatch]);

  // The login machine filled this cache entry. Subscribing keeps the answer alive while the button is
  // on screen, and asks for it again if the entry expired first.
  const { data: user } = useGetUserQuery(undefined, { skip: !isSignedIn });

  const onLogoutPress = useCallback(() => {
    setIsLoading(true);
    // Lowered again when the logout settles. The caller renders this component at all times and only
    // its answer turns null, so the component never unmounts and nothing else clears the flag. Left
    // raised, the next login would show a button stuck loading. `runLogout` never rejects.
    void runLogout(ports).finally(() => setIsLoading(false));
  }, [ports]);

  return mapUserToViewModel(isSignedIn, user, isLoading, onLogoutPress);
}
