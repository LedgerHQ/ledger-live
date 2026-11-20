import { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ContactId } from "@domain/entity-contact";
import { ScreenName } from "~/const";
import type { ManagerTab } from "~/const/manager";

export type MyWalletNavigatorStackParamList = {
  [ScreenName.MyWallet]:
    | {
        device?: Device;
        firmwareUpdate?: boolean;
        searchQuery?: string;
        installApp?: string;
        tab?: ManagerTab;
        updateModalOpened?: boolean;
      }
    | undefined;
  [ScreenName.MyWalletHelp]: undefined;
  [ScreenName.MyWalletContacts]: { title?: string } | undefined;
  [ScreenName.MyWalletContactDetail]: { contactId: ContactId };
};
