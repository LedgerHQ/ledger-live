import editDeviceName from "@ledgerhq/live-common/hw/editDeviceName";
import getDeviceName from "@ledgerhq/live-common/hw/getDeviceName";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import getBatteryStatus from "@ledgerhq/live-common/hw/getBatteryStatus";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import getVersion from "@ledgerhq/live-common/hw/getVersion";
import { createDeviceSocket as socket } from "@ledgerhq/live-common/socket/index";
import getAppAndVersion from "@ledgerhq/live-common/hw/getAppAndVersion";
import genuineCheck from "@ledgerhq/live-common/hw/genuineCheck";
import openApp from "@ledgerhq/live-common/hw/openApp";
import quitApp from "@ledgerhq/live-common/hw/quitApp";
import installApp from "@ledgerhq/live-common/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/hw/uninstallApp";
import installFinalFirmware from "@ledgerhq/live-common/hw/installFinalFirmware";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Command } from "./helpers/commands";
import type { DeviceInfo } from "@ledgerhq/types-live";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const mapDeviceInfo = (
  args: unknown[],
  {
    deviceInfo,
  }: {
    deviceInfo: DeviceInfo;
  },
) => [deviceInfo, ...args];
const mapTargetId = (args: unknown[], { deviceInfo }: { deviceInfo: DeviceInfo }) => [
  deviceInfo.targetId,
  ...args,
];
const mapP2 = (p2: unknown): [number] => [Number(p2)];

export const commands: Command<any, any>[] = [
  {
    id: "getVersion",
    exec: getVersion,
    form: [],
  },

  {
    id: "getAppAndVersion",
    exec: getAppAndVersion,
    form: [],
  },

  {
    id: "getDeviceInfo",
    exec: getDeviceInfo,
    form: [],
  },

  {
    id: "getBatteryStatus",
    exec: getBatteryStatus,
    mapArgs: mapP2,
    form: [
      {
        type: "ascii",
        default: "4",
        maxlength: 1,
      },
    ],
  },

  {
    id: "genuineCheck",
    exec: genuineCheck,
    mapArgs: mapDeviceInfo,
    dependencies: {
      deviceInfo: getDeviceInfo,
    },
    form: [],
  },

  { id: "installFinalFirmware", exec: installFinalFirmware, form: [] },

  {
    id: "installApp",
    exec: installApp,
    mapArgs: mapTargetId,
    dependencies: {
      deviceInfo: getDeviceInfo,
    },
    form: [
      {
        type: "application",
      },
    ],
  },

  {
    id: "uninstallApp",
    exec: uninstallApp,
    mapArgs: mapTargetId,
    dependencies: {
      deviceInfo: getDeviceInfo,
    },
    form: [
      {
        type: "application",
      },
    ],
  },

  {
    id: "socket",
    exec: socket,
    form: [{ url: { type: "ascii" } }],
  },

  {
    id: "openApp",
    exec: openApp,
    form: [{ type: "ascii" }],
  },

  {
    id: "quitApp",
    exec: quitApp,
    form: [],
  },

  {
    id: "getDeviceName",
    exec: getDeviceName,
    form: [],
  },

  {
    id: "editDeviceName",
    exec: editDeviceName,
    form: [
      {
        type: "ascii",
        default: "",
        maxlength: 32,
      },
    ],
  },

  {
    id: "getAddress",
    exec: getAddress,
    form: [
      {
        currency: { type: "cryptocurrency", default: bitcoinCurrency },
        path: { type: "derivationPath", default: "44'/0'/0'/0/0" },
        derivationMode: { type: "derivationMode", default: "" },
        verify: { type: "checkbox", label: "Verify" },
        askChainCode: { type: "checkbox", label: "ask chainCode" },
      },
    ],
  },
];
