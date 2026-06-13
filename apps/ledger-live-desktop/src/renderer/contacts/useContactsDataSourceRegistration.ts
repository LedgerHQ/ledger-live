import { useEffect } from "react";
import { liveContactsDataSource } from "@ledgerhq/live-dmk-shared";
import { useContactsStore } from "./hooks";
import { buildContactsDataSource } from "./contactsDataSource";

export const useContactsDataSourceRegistration = (): void => {
  const { hydrated, wallet } = useContactsStore();

  useEffect(() => {
    if (!hydrated) {
      liveContactsDataSource.setInner(null);
      return;
    }
    liveContactsDataSource.setInner(buildContactsDataSource(wallet));
    return () => {
      liveContactsDataSource.setInner(null);
    };
  }, [hydrated, wallet]);
};
