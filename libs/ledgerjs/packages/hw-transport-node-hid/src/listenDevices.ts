import EventEmitter from "events";
import { getDevices } from "@ledgerhq/hw-transport-node-hid-noevents";
import { log } from "@ledgerhq/logs";
import usb from "usb";
import debounce from "lodash/debounce";
export default (
  delay: number,
  listenDevicesPollingSkip: () => boolean
): {
  events: EventEmitter;
  stop: () => void;
} => {
  const events = new EventEmitter();
  events.setMaxListeners(0);
  let listDevices = getDevices();

  const flatDevice = (d) => d.path;

  const getFlatDevices = () => [
    ...new Set(getDevices().map((d) => flatDevice(d))),
  ];

  const getDeviceByPaths = (paths) =>
    listDevices.find((d) => paths.includes(flatDevice(d)));

  let lastDevices = getFlatDevices();

  const poll = () => {
    if (!listenDevicesPollingSkip()) {
      log("hid-listen", "Polling for added or removed devices");
      let changeFound = false;
      const currentDevices = getFlatDevices();
      const newDevices = currentDevices.filter((d) => !lastDevices.includes(d));

      if (newDevices.length > 0) {
        log("hid-listen", "New device found:", newDevices);
        listDevices = getDevices();
        events.emit("add", getDeviceByPaths(newDevices));
        changeFound = true;
      } else {
        log("hid-listen", "No new device found");
      }

      const removeDevices = lastDevices.filter(
        (d) => !currentDevices.includes(d)
      );

      if (removeDevices.length > 0) {
        log("hid-listen", "Removed device found:", removeDevices);
        events.emit("remove", getDeviceByPaths(removeDevices));
        listDevices = listDevices.filter(
          (d) => !removeDevices.includes(flatDevice(d))
        );
        changeFound = true;
      } else {
        log("hid-listen", "No removed device found");
      }

      if (changeFound) {
        lastDevices = currentDevices;
      }
    } else {
      log("hid-listen", "Polling skipped, re-debouncing");
      debouncedPoll();
    }
  };

  const debouncedPoll = debounce(poll, delay);

  const attachDetected = (device) => {
    log("hid-listen", "Device add detected:", device);
    debouncedPoll();
  };

  usb.on("attach", attachDetected);
  log("hid-listen", "attach listener added");

  const detachDetected = (device) => {
    log("hid-listen", "Device removal detected:", device);
    debouncedPoll();
  };

  usb.on("detach", detachDetected);
  log("hid-listen", "detach listener added");
  return {
    stop: () => {
      log(
        "hid-listen",
        "Stop received, removing listeners and cancelling pending debounced polls"
      );
      debouncedPoll.cancel();
      usb.removeListener("attach", attachDetected);
      usb.removeListener("detach", detachDetected);
    },
    events,
  };
};
