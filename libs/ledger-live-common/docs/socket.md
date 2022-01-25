## api/socket `createDeviceSocket` and script runner

Device operations like genuine check, managing apps or firmware update involve the establishement of a secure channel between the Ledger devices and a Ledger [HSM](https://en.wikipedia.org/wiki/Hardware_security_module).

One of the way to do that, that live-common is implementing, is using a WebSocket API: the "script runner". There are many ping-pong exchanges that happens and a WebSocket is appropriate not only for performance but also for having a lifecycle of such bond.

In live-common, we exposes this API using a [rxjs.Observable](https://github.com/ReactiveX/rxjs). It's a convenient, composable, functional, stream abstraction. We will document in here the behavior of the underlying function `createDeviceSocket`.

Here is the gist of executing a genuine check:

```js
import { createDeviceSocket } from "@ledgerhq/live-common/lib/api/socket";

const genuineCheck = (
  transport: typeof Transport,
  { targetId, perso }: { targetId: number, perso: string } // these info are returned in getDeviceInfo
): Observable<boolean> =>
  createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/genuine`,
      query: { targetId, perso }
    })
  }).pipe( // example of composing it
    filter(e.type === "result"), // let's look at the result
    map(e => e.payload === "0000") // success code for genuine check
  );
};

// usage:

genuineCheck(hidTransport, meta).subscribe(
  isSuccess => {  isSuccess ? console.log("yeah!") : console.log("bad result") },
  error => { console.error("oops!", error) }
)
```

## `createDeviceSocket` signature

```js
(Transport, { url: string }) => Observable<SocketEvent>
```

It creates a transport (that is coming from [`ledgerjs`](https://github.com/ledgerhq/ledgerjs)) and open a secure channel to the given wss:// URL. It returns an Observable of `SocketEvent` which can be one of these:

```js
type SocketEvent =
  | { type: "bulk-progress", progress: number, index: number, total: number }
  | { type: "result", payload: any }
  | { type: "warning", message: string }
  | { type: "device-permission-requested", wording: string }
  | { type: "device-permission-granted" }
  | { type: "exchange-before", nonce: number, apdu: Buffer }
  | {
      type: "exchange",
      nonce: number,
      apdu: Buffer,
      data: Buffer,
      status: Buffer
    }
  | { type: "opened" }
  | { type: "closed" };
```

The observable terminates when everything is finished with the device or errors when something unexpected happened (included device errors, see Section "Error cases").

## The protocol

The API is exposed over a secured WebSocket.

Each "script" to run is exposed under a different path, and some parameters are given to contextualize it to the device version.

For instance, installing BTC 1.3.17 on Nano S 1.6.0 will use `wss://api.ledgerwallet.com/update/install?targetId=823132164&perso=perso_11&deleteKey=nanos%2F1.6.0%2Fbitcoin%2Fapp_1.3.17_del_key&firmware=nanos%2F1.6.0%2Fbitcoin%2Fapp_1.3.17&firmwareKey=nanos%2F1.6.0%2Fbitcoin%2Fapp_1.3.17_key&hash=8514a59f3ec27eab4637fb6ec626a6ea31f876f429f1e484d29cc8ec5cf15896`

### Messages

Messages of the WebSocket channel are plain text of serialized JSON of shape: `{ query, nonce, ...otherfields }`.

- `nonce` is a counter that starts from 1.
- `query` is a discriminant field to handle different cases:

#### `query="exchange"`

`"exchange"` requests the client to execute one APDU command with the device. It is typically used for the initial secure channel establishment.

It is **never** a terminating event, meaning there are more events to come in the websocket after this one.

In this case, we have also these fields required in the JSON:

- `data`: an hexadecimal APDU command to send to the device.

At the end of the step, the client send back to the server this event:

```js
{ nonce: number,
  response: "success" | "error",
  data: string } // hexadecimal
```

In live-common case, during this step, two events are emitted out of the Observable:

```js
| { type: "exchange-before", nonce: number, apdu: Buffer }
| { type: "exchange", nonce: number, apdu: Buffer, data: Buffer, status: Buffer }
```

But this step can also emit these events, in case "Allow Manager" needs to be validated by the user:

```js
| { type: "device-permission-requested", wording: string }
| { type: "device-permission-granted" }
```

#### `query="success"`

`"success"` terminates the socket with a payload data.

It is a **terminating event**, no events are to expect from the server after this event and the websocket will be closed (by server and can be be the client too).

In this case, we have also these fields required in the JSON:

- `data` or `result`: anything. (can be a string, or a complex JSON object)

For some (legacy?) it's either `data` or `result` field that is used. In live-common side, we semantically unify this into `"payload"`.

In live-common case, an event is emitted at the end and the observable closes:

```js
| { type: "result", payload: any }
```

#### `query="error"`

`"error"` terminates the socket with an error that occured on the HSM.

- `data` field will contains the error message in String format.

in live-common case, the Observable will terminates with an error `DeviceSocketFail` containing the actual error text.

#### `query="warning"`

`"warning"` query can be emit from the HSM to notify the client of a warning. This is a system in place for Manager notification but that is not yet used at the moment. It does not terminates the stream and can be in the middle of other events.

- `data` field will contains the warning message in String format.

in live-common case, the Observable emits:

```js
  | { type: "warning", message: string }
```

#### `query="bulk"`

`"bulk"` **terminates** the socket with a big series of APDUs to execute on the device.

- `data` an Array of string. Where each string is an hexadecimal APDU to run on the device.

At this point, the client might close the WebSocket connection because we know it's a closing event. Any socket event is also silenced from the client.

In any case, the live-common logic will run all the APDUs and the progress will be notified.

```js
| { type: "bulk-progress", progress: number 0 to 1, index: number 0 to N, total: number N }
```

If everything succeed, the Observable will normally close.

If one of the APDU exchange result of a non 9000 status from the device, an error `TransportStatusError` is thrown.

If the device becomes unresponsive at some point of the execution, this step can throw `ManagerDeviceLockedError` because that's a locking case.

### Error cases

There are many cases of errors or channel interruptions.

Any of these error, if comes from the client, will unsubscribe the observable and therefore result of closing the WebSocket channel.

#### `WebsocketConnectionError`

This can typically happens Network can goes down / channel timeout. This error will be thrown in the observable.

#### `DeviceSocketFail`

An HSM error occurred.

#### `UserRefusedAllowManager`

It means user have denied the "Allow manager".

#### Transport errors

Any transport error can be thrown, for instance `DisconnectedDevice` and `DisconnectedDeviceDuringOperation` when the user unplug the device.

#### `TransportStatusError` devices returns an error code

In any cases that is not a `9000` status code, a TransportStatusError will be thrown. It is usually always managed by Live and remapped to appropriate wording (for instance, install have special code to tell "not enough space" which will be thrown if you use the higher level install app functions).

#### User interrupts the actual flow

This can happens because user cancelled/left an action and we no longer need the channel. In that case, we will just close the websocket and no error will be emitted, it's a usual Observable subscription unsubscribe().
