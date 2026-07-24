import {
  createCopyStoreProtocol,
  replaceStoreAction,
  type CopyStoreMessages,
  type StoreActionListener,
} from "@devtools/protocols/copyStore";
import type { Role, TransportProtocol } from "@devtools/transport";

type ReduxStore = {
  getState(): unknown;
  dispatch(action: unknown): void;
};

export function buildCopyStoreProtocol(
  store: ReduxStore,
  listener: StoreActionListener,
  role: Role,
): TransportProtocol<CopyStoreMessages> {
  return createCopyStoreProtocol({
    role,
    getSnapshot: () => store.getState(),
    dispatch: action => store.dispatch(action),
    setStoreState: snapshot => store.dispatch(replaceStoreAction(snapshot)),
    listener,
  });
}
