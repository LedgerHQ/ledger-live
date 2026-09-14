import { useMemo } from "react";
import {
  createContactsAnalyticsHelper,
  type ContactsAnalyticsHelper,
} from "@features/flow-contacts";
import { buildContactsGlobalProperties, useContacts } from "@features/platform-contacts";
import { createContactsAnalyticsAdapter } from "./createContactsAnalyticsAdapter";

export function useContactsAnalytics(): ContactsAnalyticsHelper {
  const contacts = useContacts();
  const adapter = useMemo(() => createContactsAnalyticsAdapter(), []);

  return useMemo(
    () =>
      createContactsAnalyticsHelper(adapter, () =>
        buildContactsGlobalProperties({
          contacts,
        }),
      ),
    [adapter, contacts],
  );
}
