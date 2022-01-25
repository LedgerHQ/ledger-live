`@ledgerhq/hw-transport-u2f` and `@ledgerhq/hw-transport-webauthn` have been deprecated.

**We strongly advise to migrate to [`@ledgerhq/hw-transport-webusb`](../packages/hw-transport-webusb) or [`@ledgerhq/hw-transport-webhid`](../packages/hw-transport-webhid).**

## Why is it deprecated?

- U2F is a technology that was hijacked by Ledger in 2016-2018 in order to achieve Web integrations of our devices. It was done at a time there was no other alternative and no way to communicate with "HID" or "WebUSB" technologies in a seemless manner.
- WebHID and WebUSB are technologies that offer a better alternative and are specfically designed to be used for bi-directional communication with USB hardware.
- Since then, we have been advised to move away from this U2F approach as it breaks U2F security assertions from the browser point of view. Moreover, Windows implementation made it unbearable to keep using this "U2F hack" with agressive pop ups
- U2F channel was a "fire and forget" protocol without even the capacity to know if a device is plugged or disconnected.
- We plan to remove the support of U2F channel proxying on our apps in Q1 2021

## What is the solution and its differences

The solution we suggest is to use either `@ledgerhq/hw-transport-webusb` or `@ledgerhq/hw-transport-webhid`. Today, in December 2020, both have relatively the same level of support: only on Chromium based browsers. WebHID currently has to be enabled by a specific configuration flag (chrome://flags/#enable-experimental-web-platform-features)

The main difference relies on the fact we can create a session with the device. **This works with a browser Permission, so the security is getting better for the user**. The challenge on the integration side, is that you must use the Transport in the context of a User Event Click. Because technically, we can only open the device in context of a click of a button, typically a "Sign Transaction" button you may already have in your interface.

You can see integrations of WebUSB at https://github.com/LedgerHQ/ledgerjs-examples

## What about Firefox then?

We have no solution for Firefox support at the moment. We hope Mozilla will eventually support WebUSB.

In the meantime, we suggest to use Ledger Live bridge on Firefox

## Where are the U2F implementations now?

We have moved them to https://github.com/LedgerHQ/ledgerjs-legacy .
