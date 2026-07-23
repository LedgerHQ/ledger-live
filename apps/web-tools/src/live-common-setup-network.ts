import { setEnv } from "@ledgerhq/live-env";
import { bridgeEnvToNetworkState } from "@ledgerhq/live-common/network/setup";

setEnv("LEDGER_CLIENT_VERSION", "ll-web-tools/0.0.0");
bridgeEnvToNetworkState();
