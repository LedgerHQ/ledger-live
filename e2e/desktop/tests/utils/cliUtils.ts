import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";
import { retry } from "@ledgerhq/live-common/promise";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import {
  runCliGetAddress,
  runCliGetTokenAllowance,
  runCliLiveData,
  runCliTokenApproval,
  type GetAddressOpts,
  type GetTokenAllowanceOpts,
  type LiveDataOpts,
  type TokenApprovalOpts,
} from "@ledgerhq/live-e2e-shared/runCli";

export const CLI = {
  liveData: function (opts: LiveDataOpts) {
    return runCliLiveData(opts);
  },
  // Desktop runs several Speculos in one process (see `speculos.relaunch` and
  // `withTemporarySpeculos`), so each transport keeps its device's address and session token, and
  // its id carries the device id (every remote device reports port 443) for `cleanSpeculos` to
  // unregister that exact module.
  registerSpeculosTransport: function (
    deviceId: string,
    apiPort: string,
    speculosAddress = "http://localhost",
  ) {
    const req: SpeculosHttpTransportOpts = {
      apiPort: apiPort,
      baseURL: speculosAddress,
      bearerToken: process.env.SPECULOS_SESSION_TOKEN,
    };

    registerTransportModule({
      id: "speculos-http-" + deviceId,
      open: () => retry(() => DeviceManagementKitTransportSpeculos.open(req)),
      disconnect: () => Promise.resolve(),
    });
  },
  getAddress: (opts: GetAddressOpts) => runCliGetAddress(opts),
  tokenApproval: function (opts: TokenApprovalOpts) {
    return runCliTokenApproval(opts);
  },
  getTokenAllowance: function (opts: GetTokenAllowanceOpts) {
    return runCliGetTokenAllowance(opts);
  },
};
