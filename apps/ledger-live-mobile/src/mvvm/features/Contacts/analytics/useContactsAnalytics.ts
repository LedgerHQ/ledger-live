import { useMemo } from "react";
import {
  createContactsAnalyticsHelper,
  type ContactsAnalyticsHelper,
  useContactsFeature,
} from "@features/flow-contacts";
import { buildContactsGlobalProperties, useContacts } from "@features/platform-contacts";
import { createContactsAnalyticsAdapter } from "./createContactsAnalyticsAdapter";

export function useContactsAnalytics(): ContactsAnalyticsHelper {
  const contacts = useContacts();
  const { isEnabled } = useContactsFeature("mobile");
  const adapter = useMemo(() => createContactsAnalyticsAdapter(), []);

  return useMemo(
    () =>
      createContactsAnalyticsHelper(adapter, () =>
        buildContactsGlobalProperties({
          ffAddressBookEnabled: isEnabled,
          contacts,
        }),
      ),
    [adapter, contacts, isEnabled],
  );
}
