import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetUserQuery } from "@domain/api-card-management";
import type { PayCardUser } from "@domain/api-card-management";
import { useTranslation } from "@shared/i18n";
import { createCardLogoutPorts } from "../../state/createCardLogoutPorts";
import type { CardLoginDispatch } from "../../state/createCardLoginPorts";
import { selectIsSignedIn } from "../../state/selectors";
import type { CardLogoutPorts } from "../../state/types";
import type { CardMoreRow, CardMoreRowId, CardMoreViewModel } from "./types";

const ROW_ORDER: readonly CardMoreRowId[] = ["managePin", "accessBaanx", "help", "logout"];

const noop = () => {};

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

const running = new WeakSet<CardLogoutPorts>();

export function startLogout(ports: CardLogoutPorts): void {
  if (running.has(ports)) {
    return;
  }
  running.add(ports);
  void runLogout(ports).finally(() => running.delete(ports));
}

export type CardMoreLabels = Readonly<{
  more: string;
  sheetTitle: string;
  rows: Readonly<Record<CardMoreRowId, string>>;
}>;

export type CardMoreHandlers = Readonly<
  Partial<Record<Exclude<CardMoreRowId, "logout">, () => void>> & Record<"logout", () => void>
>;

type MapUserToViewModelInput = Readonly<{
  isSignedIn: boolean;
  user: PayCardUser | undefined;
  labels: CardMoreLabels;
  isSheetOpen: boolean;
  onMorePress: () => void;
  onSheetClose: () => void;
  handlers: CardMoreHandlers;
}>;

/**
 * Turns the signed-in flag, plus the user in the cache, into the view props. Pure, so the mapping can
 * be read and tested without a React tree.
 */
export function mapUserToViewModel({
  isSignedIn,
  user,
  labels,
  isSheetOpen,
  onMorePress,
  onSheetClose,
  handlers,
}: MapUserToViewModelInput): CardMoreViewModel {
  // Nobody is signed in, or the user answer is still on its way back from the cache.
  if (!isSignedIn || !user) {
    return null;
  }

  const rows: readonly CardMoreRow[] = ROW_ORDER.map(id => ({
    id,
    title: labels.rows[id],
    onPress: handlers[id] ?? noop,
  }));

  return {
    moreLabel: labels.more,
    sheetTitle: labels.sheetTitle,
    rows,
    isSheetOpen,
    onMorePress,
    onSheetClose,
  };
}

export function useCardMoreViewModel(): CardMoreViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch<CardLoginDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [wasSignedIn, setWasSignedIn] = useState(isSignedIn);

  const ports = useMemo(() => createCardLogoutPorts(dispatch), [dispatch]);

  // The login machine filled this cache entry. Subscribing keeps the answer alive while the tile is
  // on screen, and asks for it again if the entry expired first.
  const { data: user } = useGetUserQuery(undefined, { skip: !isSignedIn });

  if (wasSignedIn !== isSignedIn) {
    setWasSignedIn(isSignedIn);
    if (!isSignedIn) {
      setIsSheetOpen(false);
    }
  }

  const onMorePress = useCallback(() => setIsSheetOpen(true), []);
  const onSheetClose = useCallback(() => setIsSheetOpen(false), []);

  const onLogoutPress = useCallback(() => {
    setIsSheetOpen(false);
    startLogout(ports);
  }, [ports]);

  const labels = useMemo<CardMoreLabels>(
    () => ({
      more: t("payTab.cardMore.tile"),
      sheetTitle: t("payTab.cardMore.title"),
      rows: {
        managePin: t("payTab.cardMore.rows.managePin"),
        accessBaanx: t("payTab.cardMore.rows.accessBaanx"),
        help: t("payTab.cardMore.rows.help"),
        logout: t("payTab.cardMore.rows.logout"),
      },
    }),
    [t],
  );

  const handlers = useMemo<CardMoreHandlers>(() => ({ logout: onLogoutPress }), [onLogoutPress]);

  return mapUserToViewModel({
    isSignedIn,
    user,
    labels,
    isSheetOpen,
    onMorePress,
    onSheetClose,
    handlers,
  });
}
