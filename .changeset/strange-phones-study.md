---
"@ledgerhq/native-ui": patch
---

fix: onModalHide passed down to ReactNativeModal

`BaseModal` was not passing down `onModalHide` to `ReactNativeModal`. Until this, `onModalHide={onClose}`, making `onClose` being called twice (once when the user closes the modal, once when the modal is hidden) and `onModalHide` being never called.

The fix is a workaround so we don't break legacy components that use `BaseModal`. The long-term fix would be to have `onModalHide={onModalHide}` and make sure every usage on `onClose` in the consumers of this component expect the correct behavior.
