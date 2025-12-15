import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import { Store } from "redux";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import type { State } from "~/reducers/types";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;
  private store: Store<State> | null = null;

  setStore(store: Store<State>) {
    this.store = store;
  }

  async execute(event: SegmentEvent) {
    if (!this.store || !event) {
      return event;
    }

    const userId = userIdSelector(this.store.getState());
    // eslint-disable-next-line no-param-reassign
    event.userId = userId.exportUserIdForSegment();
    return event;
  }
}
