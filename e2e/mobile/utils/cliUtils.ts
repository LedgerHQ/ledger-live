import {
  registerTransportModule,
  unregisterAllTransportModules,
} from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";
import {
  ledgerKeyRingProtocol,
  ledgerSync,
  restoreTrustchain,
} from "@ledgerhq/live-e2e-shared/ledgerSync/cli";
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

type RegisterSpeculosTransportOptions = {
  apiPort: string;
  speculosAddress?: string;
};

export const CLI = {
  ledgerKeyRingProtocol,
  ledgerSync,
  restoreTrustchain,
  liveData: function (opts: LiveDataOpts) {
    return runCliLiveData(opts);
  },
  // Mobile keeps exactly one active transport, so the registry is wiped and the id is constant.
  registerSpeculosTransport: function (options: RegisterSpeculosTransportOptions) {
    const { apiPort, speculosAddress = "http://localhost" } = options;
    unregisterAllTransportModules();
    const req: SpeculosHttpTransportOpts = {
      apiPort: apiPort,
      baseURL: speculosAddress,
    };

    registerTransportModule({
      id: "speculos-http",
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
