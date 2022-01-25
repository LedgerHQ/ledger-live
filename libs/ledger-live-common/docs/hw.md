# Hardware Wallet logic

_live-common_ libraries centralizes Ledger hardware wallet device logic via exposing many functions in [`src/hw`](../src/hw).

Most of these functions share one of these signature:

```js
(Transport, ...) => Promise<...>
(Transport, ...) => Observable<...>
```

They take a [Transport](https://github.com/LedgerHQ/ledgerjs) (a communication layer), potentially some parameters, will run logic with the device transport and will eventually return a result (it's asynchronous).

## modular `open` and `deviceAccess`

Many ways to communicate with our device exists as shown by the many implementations we have in [ledgerjs](https://github.com/LedgerHQ/ledgerjs).

To faciliate this fact, _live-common_ unifies a modular and multi-transport system that allows to register some "transport modules" using `registerTransportModule` (typically in your `live-common-setup.js`). When you need to access a transport, you can use the generic `open(id)` function OR if you need a race condition protection, you can use `withDevice(id)(job)` where `job` is a `(t: typeof Transport) => Observable<T>`.

This is on userland to glue everything together, for instance:

```js
import { from } from "rxjs";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import { registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";

/*
example_verifyAnAddress({
  deviceId: "webhid",
  currency: getCryptoCurrencyById("bitcoin"),
  derivationMode: "",
  path: "44'/0'/0'/0/0"
}) 
 */

function example_verifyAnAddress({ deviceId, currency, derivationMode, path }) {
  withDevice(deviceId)(t =>
    from(
      getAddress(t, {
        currency,
        derivationMode,
        path,
        verify: true
      })
    )
  ).subscribe(
    addrResult => console.log(addrResult),
    error => console.error(error)
  );
}

// setup the transport

registerTransportModule({
  id: "webhid",
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webhid")) {
      return TransportWebHID.create();
    }
    return null;
  }
});

const webusbDevices = {};
registerTransportModule({
  id: "webusb",
  open: (id: string): ?Promise<*> => {
    if (id.startsWith("webusb")) {
      const existingDevice = webusbDevices[id];
      return existingDevice
        ? TransportWebUSB.open(existingDevice)
        : typeof TransportWebUSB.create();
    }
    return null;
  }
});
```

## List of features

TO BE DOCUMENTED. list out every src/hw that are interesting to cover and document quickly?
