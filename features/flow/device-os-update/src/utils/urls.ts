import { DeviceModelId } from "@ledgerhq/device-management-kit";

export const OS_RELEASE_NOTES_URLS: Readonly<Record<DeviceModelId, string>> = {
  [DeviceModelId.NANO_S]: "https://support.ledger.com/article/360010446000-zd",
  [DeviceModelId.NANO_SP]: "https://support.ledger.com/article/4494540771997-zd",
  [DeviceModelId.NANO_X]: "https://support.ledger.com/article/360014980580-zd",
  [DeviceModelId.STAX]: "https://support.ledger.com/article/Ledger-Stax-OS-release-notes",
  [DeviceModelId.FLEX]: "https://support.ledger.com/article/Ledger-Flex-OS-release",
  [DeviceModelId.APEX]: "https://support.ledger.com/article/ledger-nano-gen5-release-notes",
};
