import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

export const CONTACT_DETAIL_ACTION_PARAM = "action";

export type ContactDetailAction = "add-address";

export type ContactDetailActionHandlers<TContact> = Readonly<
  Partial<Record<ContactDetailAction, (contact: TContact) => void>>
>;

/**
 * Consumes a `?action=<name>` query param once the target contact is loaded,
 * runs the matching handler, then strips the param so a refresh does not
 * replay it. Mirrors the Earn `useDeepLinkListener` convention: adding a new
 * contact action only means adding an entry to `handlers`.
 */
export function useContactDetailActionParam<TContact>(
  contact: TContact | undefined,
  handlers: ContactDetailActionHandlers<TContact>,
): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const handledAction = useRef<string | null>(null);

  useEffect(() => {
    const action = searchParams.get(CONTACT_DETAIL_ACTION_PARAM);
    if (action === null || handledAction.current === action) {
      return;
    }

    const handler = handlers[action as ContactDetailAction];
    if (handler === undefined || contact === undefined) {
      return;
    }

    handledAction.current = action;
    handler(contact);
    setSearchParams(
      params => {
        params.delete(CONTACT_DETAIL_ACTION_PARAM);
        return params;
      },
      { replace: true },
    );
  }, [contact, handlers, searchParams, setSearchParams]);
}
