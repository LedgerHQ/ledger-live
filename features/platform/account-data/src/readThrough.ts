type Dispatch = (action: { type: string }) => unknown;

type Steps<T> = {
  requested: { type: string };
  read: () => Promise<T>;
  received: (result: T) => { type: string };
  failed: (error: string) => { type: string };
};

/** requested → read → received | failed. Shared by every account-* thunk. */
export async function readThrough<T>(dispatch: Dispatch, steps: Steps<T>): Promise<void> {
  dispatch(steps.requested);
  try {
    dispatch(steps.received(await steps.read()));
  } catch (error) {
    dispatch(steps.failed(error instanceof Error ? error.message : String(error)));
  }
}

/** A negative age is a clock that moved, not a fresh read. */
export const isFresh = (at: number | undefined, maxAge: number): boolean => {
  if (maxAge <= 0 || at === undefined) return false;
  const age = Date.now() - at;
  return age >= 0 && age < maxAge;
};
