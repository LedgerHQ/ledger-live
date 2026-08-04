import {
  intParser,
  boolParser,
  stringParser,
  jsonParser,
  stringArrayParser,
} from "@ledgerhq/live-env";

const teamPlatform = {
  FEATURE_FLAGS: {
    def: {},
    parser: jsonParser,
    desc: "key value map for feature flags: {[key in FeatureId]?: Feature}",
  },
  MOCK: {
    def: "",
    parser: stringParser,
    desc: "switch the app into a MOCK mode for test purpose, the value will be used as a seed for the rng. Avoid falsy values.",
  },
  MOCK_OS_VERSION: {
    def: "",
    parser: stringParser,
    desc: "if defined, overrides the os and version. format: os@version. Example: Windows_NT@6.1.7601",
  },
  MOCK_NO_BYPASS: {
    def: false,
    parser: boolParser,
    desc: "if defined, avoids bypass of the currentDevice in the store.",
  },
  STATUS_API_URL: {
    def: "https://ledger.statuspage.io/api",
    parser: stringParser,
    desc: "url used to fetch ledger status",
  },
  STATUS_API_VERSION: {
    def: 2,
    parser: intParser,
    desc: "version used for ledger status api",
  },
  PUSH_DEVICES_SERVICE_URL: {
    def: "https://device-gateway.api.ledger.com",
    parser: stringParser,
    desc: "Push Devices Service url for device tracking",
  },
  VERBOSE: {
    def: [] as Array<string>,
    parser: stringArrayParser,
    desc: 'Sets up debug console printing of logs. `VERBOSE=1` or `VERBOSE=true`: to print all logs | `VERBOSE="apdu,hw,transport,hid-verbose"` : filtering on a list of log `type` separated by a `,`',
  },
  EXPORT_EXCLUDED_LOG_TYPES: {
    def: "ble-frame",
    parser: stringParser,
    desc: "comma-separated list of excluded log types for exported logs",
  },
  EXPORT_MAX_LOGS: {
    def: 5000,
    parser: intParser,
    desc: "maximum logs to keep for export",
  },
  LOG_DRAWERS: {
    def: false,
    parser: boolParser,
    desc: "Enable logs for drawers",
  },
  PERFORMANCE_CONSOLE: {
    def: false,
    parser: boolParser,
    desc: "Show a performance overlay on the app UI",
  },
  STORAGE_PERFORMANCE_OVERLAY: {
    def: false,
    parser: boolParser,
    desc: "Show a performance overlay on the app storage",
  },
  JS_THREAD_MONITOR: {
    def: false,
    parser: boolParser,
    desc: "Show JS thread stall monitor overlay",
  },
  CLOUD_SYNC_API_STAGING: {
    def: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
    parser: stringParser,
    desc: "wallet sync api staging base url",
  },
  CLOUD_SYNC_API_PROD: {
    def: "https://cloud-sync.api.live.ledger.com",
    parser: stringParser,
    desc: "wallet sync api production base url",
  },
  TRUSTCHAIN_API_STAGING: {
    def: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
    parser: stringParser,
    desc: "Trustchain API Staging",
  },
  TRUSTCHAIN_API_PROD: {
    def: "https://trustchain.api.live.ledger.com",
    parser: stringParser,
    desc: "Trustchain API Prod",
  },
};

export default teamPlatform;
