import type { MessageData as BridgeMessageData } from "@ledgerhq/live-e2e-shared/bridge/types";
import type { PayCardPersistedState } from "~/db";
import type { ReceiveVerifyHintState } from "@features/flow-receive/state";
import type { SettingsState } from "~/reducers/types";

export type { ServerData } from "@ledgerhq/live-e2e-shared/bridge/types";

export type MessageData = BridgeMessageData<{
  settings: Partial<SettingsState>;
  payCard: Partial<PayCardPersistedState>;
  receiveVerifyHint: Partial<ReceiveVerifyHintState>;
}>;
