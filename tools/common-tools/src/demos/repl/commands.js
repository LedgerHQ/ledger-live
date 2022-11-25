// @flow
import editDeviceName from "@ledgerhq/live-common/lib/hw/editDeviceName";
import getDeviceName from "@ledgerhq/live-common/lib/hw/getDeviceName";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import getVersion from "@ledgerhq/live-common/lib/hw/getVersion";
import { createDeviceSocket as socket } from "@ledgerhq/live-common/lib/api/socket";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import installFinalFirmware from "@ledgerhq/live-common/lib/hw/installFinalFirmware";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import type { Command } from "./helpers/commands";

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const mapDeviceInfo = (args, { deviceInfo }) => [deviceInfo, ...args];
const mapTargetId = (args, { deviceInfo }) => [deviceInfo.targetId, ...args];

export const commands: Command[] = [
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
