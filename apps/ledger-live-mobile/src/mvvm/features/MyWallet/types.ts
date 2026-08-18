import { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ContactId } from "@domain/entity-contact";
import { ScreenName } from "~/const";

export type MyWalletNavigatorStackParamList = {
  [ScreenName.MyWallet]:
    | {
        device?: Device;
        firmwareUpdate?: boolean;
        searchQuery?: string;
        installApp?: string;
      }
    | undefined;
  [ScreenName.MyWalletHelp]: undefined;
  [ScreenName.MyWalletContacts]: undefined;
  [ScreenName.MyWalletContactDetail]: { contactId: ContactId };
};
