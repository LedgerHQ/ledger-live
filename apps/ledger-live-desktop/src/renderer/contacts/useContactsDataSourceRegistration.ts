import { useEffect } from "react";
import { liveContactsDataSource } from "@ledgerhq/live-dmk-shared";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { useContactsStore } from "./hooks";
import { buildContactsDataSource } from "./contactsDataSource";

export const useContactsDataSourceRegistration = (): void => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { hydrated, wallet } = useContactsStore();

  useEffect(() => {
    if (!contactsAlpha || !hydrated) {
      liveContactsDataSource.setInner(null);
      return;
    }
    liveContactsDataSource.setInner(buildContactsDataSource(wallet));
    return () => {
      liveContactsDataSource.setInner(null);
    };
  }, [contactsAlpha, hydrated, wallet]);
};
