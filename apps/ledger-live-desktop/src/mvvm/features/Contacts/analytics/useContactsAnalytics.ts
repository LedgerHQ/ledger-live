import { createContactsAnalyticsHelper } from "@features/flow-contacts";
import { buildContactsGlobalProperties, useContacts } from "@features/platform-contacts";
import { useMemo } from "react";
import { createContactsAnalyticsAdapter } from "./createContactsAnalyticsAdapter";

export function useContactsAnalytics() {
  const contacts = useContacts();

  return useMemo(
    () =>
      createContactsAnalyticsHelper(createContactsAnalyticsAdapter(), () =>
        buildContactsGlobalProperties({
          contacts,
        }),
      ),
    [contacts],
  );
}
