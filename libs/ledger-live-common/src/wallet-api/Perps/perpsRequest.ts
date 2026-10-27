import { v4 as uuid } from "uuid";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";

type PendingRequest<T> = {
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  committed: boolean;
};

export type PerpsRequest<T> = {
  begin: () => Promise<T>;
  getId: () => string | null;
  settle: (id: string | null, result: T) => void;
  markCommitted: (id: string | null) => void;
  /** With an `id`, only cancels that request, so a stale caller cannot cancel a newer one. */
  cancel: (id?: string | null) => void;
};

export function createPerpsRequest<T>(): PerpsRequest<T> {
  const requests = new Map<string, PendingRequest<T>>();
  let currentId: string | null = null;

  const cancel = (id?: string | null) => {
    if (id !== undefined && id !== currentId) return;
    if (currentId === null) return;
    const current = requests.get(currentId);
    if (current?.committed) return;
    current?.reject(new UserRefusedOnDevice());
    requests.delete(currentId);
    currentId = null;
  };

  return {
    begin: () => {
      cancel();
      const id = uuid();
      currentId = id;
      return new Promise<T>((resolve, reject) => {
        requests.set(id, { resolve, reject, committed: false });
      });
    },
    getId: () => currentId,
    settle: (id, result) => {
      if (id === null) return;
      const request = requests.get(id);
      if (!request) return;
      request.resolve(result);
      requests.delete(id);
      if (currentId === id) currentId = null;
    },
    markCommitted: id => {
      if (id === null) return;
      const request = requests.get(id);
      if (request) request.committed = true;
    },
    cancel,
  };
}
