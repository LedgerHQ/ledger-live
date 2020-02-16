# gist: firmware update with a Ledger device

We start a new project and add live-common and some helpers

```bash
yarn add @ledgerhq/live-common
yarn add rxjs   # for Observable
```

Now we need a concrete implementation of a Transport to use the ledger device with. _In our example we're going to do a Node.js script that works with USB_, so we're just going to install these:

```bash
yarn add @ledgerhq/hw-transport-node-hid-noevents
```

**We're all set up, let's write a script that will perform a firmware update!**

```js
const { concat } = require("rxjs/operators");
const getDeviceInfo = require("@ledgerhq/live-common/lib/getDeviceInfo")
  .default;
const manager = require("@ledgerhq/live-common/lib/manager").default;
const prepare = require("@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare")
  .default;
const main = require("@ledgerhq/live-common/lib/hw/firmwareUpdate-main")
  .default;

const deviceId = ""; // in HID case

//////////////////////////////////
// live-common requires some setup. usually we put that in a live-common-setup.js

const { registerTransportModule } = require("@ledgerhq/live-common/lib/hw");
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid-noevents")
  .default;

// configure which transport are available
registerTransportModule({
  id: "hid",
  open: devicePath => TransportNodeHid.open(devicePath),
  disconnect: () => Promise.resolve()
});

/////////////////////////

async function updateLogic() {
  const deviceInfo = await withDevice("")(t => getDeviceInfo(t));
  const firmware = await manager.getLatestFirmwareForDevice(deviceInfo);
  if (!firmware) return "up to date";

  concat(prepare("", firmware), main("", firmware)).subscribe(e =>
    console.log(e)
  );
}

updateLogic();
```
