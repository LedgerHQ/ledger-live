import {
  getInitialStore,
  TrustchainState,
  trustchainHandlers,
  TrustchainHandlersPayloads,
  TrustchainHandlers,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { handleActions } from "redux-actions";

export default handleActions<
  TrustchainState,
  TrustchainHandlersPayloads[keyof TrustchainHandlersPayloads]
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
>(trustchainHandlers as unknown as TrustchainHandlers<false>, getInitialStore());
