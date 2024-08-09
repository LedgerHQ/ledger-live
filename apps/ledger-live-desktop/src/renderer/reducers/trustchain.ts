import {
  getInitialStore,
  TrustchainStore,
  trustchainHandlers,
  TrustchainHandlersPayloads,
  TrustchainHandlers,
} from "@ledgerhq/trustchain/store";
import { handleActions } from "redux-actions";

export default handleActions<
  TrustchainStore,
  TrustchainHandlersPayloads[keyof TrustchainHandlersPayloads]
>(trustchainHandlers as unknown as TrustchainHandlers<false>, getInitialStore());
