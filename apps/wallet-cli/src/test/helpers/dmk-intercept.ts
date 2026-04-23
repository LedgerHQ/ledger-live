import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  MockDeviceManagementKit,
  type MockDeviceState,
  type MockAppResults,
} from "../../device/mock-dmk";
import { WalletCliDmkTransport } from "../../device/wallet-cli-dmk-transport";
import { _setTestDmkTransport } from "../../device/register-dmk-transport";

const stateEnv = process.env.WALLET_CLI_MOCK_DMK_STATE ?? "connected";

// Coin-specific results injected by tests via WALLET_CLI_MOCK_APP_RESULTS (JSON string).
// Shape: { "<AppName>": { <result fields> }, ... }
// Example: { "Ethereum": { "publicKey": "...", "address": "0x..." } }
const appResultsEnv = process.env.WALLET_CLI_MOCK_APP_RESULTS;
const appResults: MockAppResults = appResultsEnv
  ? (JSON.parse(appResultsEnv) as MockAppResults)
  : {};

const mock = new MockDeviceManagementKit({
  initialState: stateEnv as MockDeviceState,
  appResults,
});

const transport = new WalletCliDmkTransport(
  mock as unknown as DeviceManagementKit,
  "mock-session-id",
);
_setTestDmkTransport(transport);
