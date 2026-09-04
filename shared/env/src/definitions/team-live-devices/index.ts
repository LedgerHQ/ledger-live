import {
  intParser,
  floatParser,
  boolParser,
  stringParser,
  jsonParser,
} from "@ledgerhq/live-env";

// Firmware 1.9.1 leaves an OS update available, so the firmware-update flow can be exercised.
const DEFAULT_MOCK_SERVER_SESSION = {
  devices: [
    {
      name: "Ledger Stax",
      device_type: "stax",
      connectivity_type: "USB",
      firmware_version: "1.9.1",
      apps: [{ name: "BOLOS", version: "1.4.0" }],
    },
  ],
};

const teamLiveDevices = {
  MANAGER_API_BASE: {
    def: "https://manager.api.live.ledger.com/api",
    parser: stringParser,
    desc: "Ledger Manager API",
  },
  MANAGER_DEV_MODE: {
    def: false,
    parser: boolParser,
    desc: "enable visibility of utility apps in Manager",
  },
  MANAGER_INSTALL_DELAY: {
    def: 1000,
    parser: intParser,
    desc: "defines the time to wait before installing apps to prevent known glitch (<=1.5.5) when chaining installs",
  },
  DEVICE_CANCEL_APDU_FLUSH_MECHANISM: {
    def: true,
    parser: boolParser,
    desc: "enable a mechanism that send a 0x00 apdu to force device to awake from its 'Processing' UI state",
  },
  DEVICE_PROXY_URL: {
    def: "",
    parser: stringParser,
    desc: "enable a proxy to use instead of a physical device",
  },
  DEVICE_PROXY_MODEL: {
    def: "nanoS",
    parser: stringParser,
    desc: "allow to override the default model of a proxied device",
  },
  BASE_SOCKET_URL: {
    def: "wss://scriptrunner.api.live.ledger.com/update",
    parser: stringParser,
    desc: "Ledger script runner API",
  },
  DISABLE_FW_UPDATE_VERSION_CHECK: {
    def: false,
    parser: boolParser,
    desc: "disable the version check for firmware update eligibility",
  },
  DISABLE_APP_VERSION_REQUIREMENTS: {
    def: false,
    parser: boolParser,
    desc: "force an old application version to be accepted regardless of its version",
  },
  WITH_DEVICE_POLLING_DELAY: {
    def: 500,
    parser: floatParser,
    desc: "delay when polling device",
  },
  LOW_BATTERY_PERCENTAGE: {
    def: 20,
    parser: intParser,
    desc: "Configure the low battery percentage threshold",
  },
  USER_ID: {
    def: "",
    parser: stringParser,
    desc: "unique identifier of app instance. used to derivate dissociated ids for difference purposes (e.g. the firmware update incremental deployment).",
  },
  COINAPPS: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) defines the folder for speculos mode that contains Nano apps binaries (.elf) in a specific structure: <device>/<firmware>/<appName>/app_<appVersion>.elf",
  },
  SEED: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) seed to be used by speculos (device simulator)",
  },
  SPECULOS_API_PORT: {
    def: 0,
    parser: intParser,
    desc: "API port for speculos",
  },
  SPECULOS_DEVICE: {
    def: "",
    parser: stringParser,
    desc: "Device model id for speculos",
  },
  SPECULOS_FIRMWARE_VERSION: {
    def: "",
    parser: stringParser,
    desc: "Firmware version for speculos",
  },
  SPECULOS_PID_OFFSET: {
    def: 0,
    parser: intParser,
    desc: "offset to be added to the speculos pid and avoid collision with other instances",
  },
  /**
   * It's just here as a backup, the REST API is supposed to be the right mode
   * We can always fallback on the previous method if we need to.
   * The websocket option is harmless, we can remove it at some point but let's
   * keep it for a while just in case.
   * Introduced on June 27th 2023 by https://github.com/LedgerHQ/ledger-live/pull/3824
   */
  SPECULOS_USE_WEBSOCKET: {
    def: false,
    parser: boolParser,
    desc: "Use speculos websocket interface instead of Rest API",
  },
  EXPERIMENTAL_BLE: {
    def: false,
    parser: boolParser,
    desc: "enable experimental support of Bluetooth",
  },
  EXPERIMENTAL_MANAGER: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental version of Manager",
  },
  EXPERIMENTAL_USB: {
    def: false,
    parser: boolParser,
    desc: "enable an experimental implementation of USB support",
  },
  MOCK_APP_UPDATE: {
    def: false,
    parser: boolParser,
    desc: "Always shows app update in the manager",
  },
  FORCE_PROVIDER: {
    def: 1,
    parser: intParser,
    desc: "use a different provider for app store (for developers only)",
  },
  MOCK_SERVER_TRANSPORT: {
    def: false,
    parser: boolParser,
    desc: "enable the Device Management Kit mock server transport (connects to a device mock server instead of a physical device)",
  },
  MOCK_SERVER_TRANSPORT_URL: {
    def: "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com",
    parser: stringParser,
    desc: "base URL of the device mock server backing the mock server transport. Defaults to the shared deployment; override to point at a local instance (e.g. http://localhost:9752)",
  },
  MOCK_SERVER_SEED: {
    def: "",
    parser: stringParser,
    desc: "(dev feature) BIP39 mnemonic pushed to the mock server session at boot; the server forwards it to Speculos on every app open. Empty (default) keeps the mock server's own seed",
  },
  MOCK_SERVER_SESSION: {
    def: DEFAULT_MOCK_SERVER_SESSION,
    parser: jsonParser,
    desc: '(dev feature) JSON session imported into the mock server at boot: {"devices":[{name,device_type,connectivity_type,firmware_version,apps,mocks,catalog}]}. Defaults to a single USB Stax on firmware 1.9.1',
  },
};

export default teamLiveDevices;
