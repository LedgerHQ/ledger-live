---
"@ledgerhq/wallet-cli": minor
---

Add an optional Bluetooth Low Energy (BLE) transport to wallet-cli, selectable with `WALLET_CLI_TRANSPORT=ble` (default stays `usb`, so existing flows are unchanged). The BLE transport drives Flex/Stax/Nano X over the same DMK device-action layer as USB: framing is delegated to DMK's ApduSender/ApduReceiver services and BLE service/characteristic UUIDs come from `deviceModelDataSource`, so it stays in sync with the device models DMK knows about. This lets the CLI run on hosts where the device is paired over Bluetooth rather than cabled.
