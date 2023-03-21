# IPC Transport

IPCTransport is an implementation of a [Transport](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport) specific to Ledger Live Desktop.
It allows to communicate with the Ledger device from the renderer side, in a non blocking way and where the actual implementation still have to run on a Node environment (because of node-hid, which is CPU blocking on read/write) and without having to move the business logic somewhere else (which used to be our previous "Internal commands" architecture).

## Renderer usage

On renderer side, we use it in two places:

- In `live-common-setup.ts`, the transport is registered to the live-common registry.
- in `useListenToHidDevices`, the `listen`function is utilized to monitor device connections.

## IPC Plumbing Overview

There are still 3 parts involved at the moment: renderer, main and internal.

The essential goal is to proxy all the calls specifics of Transport from renderer to internal (going through main) and back.

There are 3 kind of events: the "promise" ones, like open() and exchange, the "observable" ones, like listen() and exchangeBulk() which also need the "event" kind: when we unsubscribe to these observable.

### `exchange` Promise example

**On renderer side, when someone is doing a `transport.exchange(data)` this is what happens:**

Electron IPC is used:

```js
const requestId = uuidv4();
ipcRenderer.send("transport:exchange", { data, requestId });
ipcRenderer.once(`transport:exchange_RESPONSE_${requestId}`, (event, result) => {
  // HERE we can resolve the promise with the response
});
```

> `requestId` is a unique ID that identify the message with its response and allows parallel calls to be possible.

**On main side, we receive the event and we forward it to internal:**

```js
ipcMain.on("transport:exchange", (event, { data, requestId }) => {
  internal.send({ type: "transport:exchange", data, requestId });

  // AND we also pipe the response channel

  const replyChannel = `transport:exchange_RESPONSE_${requestId}`;
  const handler = message => {
    if (message.type === "transport:exchange" && message.requestId === requestId) {
      if (message.error) {
        event.reply(replyChannel, { error: message.error });
      } else {
        event.reply(replyChannel, { data: message.data });
      }
      internal.process.removeListener("message", handler);
    }
  };
});
```

**On internal side, we receive the event and we forward it to the actual transport:**

```js
export const transportExchange = ({ data, requestId }) => {
  const subject = transports.get(data.descriptor);
  if (!subject) {
    process.send?.({
      type: transportExchangeChannel,
      error: serializeError(
        new DisconnectedDeviceDuringOperation("No open transport for the given descriptor"),
      ),
      requestId,
    });
    return;
  }
  subject.next({ type: "exchange", apduHex: data.apduHex, requestId });
};
```

Now, this part is interesting: we are actually expecting the transport to have been opened before, and kept in a `transports` map. This is what the transportOpen has done and it will plug all the events coming on the global subject to do effect on the transport.

### `exchangeBulk` Observable example

The exact same idea applies now for the Observable. The main difference is that we can then receive more than one event on an observable, and we also need to be able to unsubscribe to the Observable, so we need to have a way to send an event to the internal to unsubscribe.

Knowing this, the implementation of `exchangeBulk` on the renderer side is straightforward:

```js
exchangeBulk(apdus: Buffer[], observer: Observer<Buffer>): Subscription {
  const apdusHex = apdus.map(apdu => apdu.toString("hex"));
  log("apdu-info", "bulk of " + apdusHex.length + " apdus");

  const requestId = uuidv4();
  const replyChannel = `${transportExchangeBulkChannel}_RESPONSE_${requestId}`;
  const handler = (event, message) => {
    if (message.error) {
      observer.error(deserializeError(message.error));
    } else {
      const { data } = message;
      if (data) {
        observer.next(Buffer.from(data, "hex"));
      } else {
        observer.complete();
      }
    }
  };

  ipcRenderer.on(replyChannel, handler);
  ipcRenderer.send(transportExchangeBulkChannel, {
    data: {
      descriptor: this.id,
      apdusHex,
    },
    requestId,
  });

  return {
    unsubscribe: () => {
      ipcRenderer.removeListener(replyChannel, handler);
      ipcRenderer.send(transportExchangeBulkUnsubscribeChannel, {
        data: {
          descriptor: this.id,
        },
        requestId,
      });
    },
  };
}
```

## Generalisation

The event forwarding pattern is generalized in main where you can then find all the definitions.

```js
internalHandlerPromise(transportOpenChannel);
internalHandlerPromise(transportExchangeChannel);
internalHandlerPromise(transportCloseChannel);
internalHandlerObservable(transportExchangeBulkChannel);
internalHandlerObservable(transportListenChannel);
internalHandlerEvent(transportExchangeBulkUnsubscribeChannel);
internalHandlerEvent(transportListenUnsubscribeChannel);
```
