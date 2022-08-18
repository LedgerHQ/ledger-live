import React, { useEffect, useState } from "react";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import Item from "./Item";

const USBAndProxyItems = () => {
  const [USBDevice, setUSBDevice] = useState();
  const [ProxyDevice, setProxyDevice] = useState();

  useEffect(() => {
    const filter = ({ id }) => ["hid", "httpdebug"].includes(id);
    const sub = discoverDevices(filter).subscribe(e => {
      const setDevice = e.id.startsWith("hid") ? setUSBDevice : setProxyDevice;

      if (e.type === "remove") setDevice();
      if (e.type === "add") {
        const { name, deviceModel, id, wired } = e;
        setDevice({ name, deviceModel, id, wired });
      }
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <>
      {USBDevice ? <Item device={USBDevice} /> : null}
      {ProxyDevice ? <Item device={ProxyDevice} /> : null}
    </>
  );
};

export default USBAndProxyItems;
