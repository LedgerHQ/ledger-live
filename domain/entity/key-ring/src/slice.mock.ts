import { KeyRingStateSchema } from "./schema";
import { mockKeyRingMemberKeyRecord, mockKeyRingTreeRecord } from "./schema.mock";
import type { KeyRingState } from "./types";

/**
 * The `trustchain` slice of a member instance: a member key and the key tree it joined. Pass
 * `{ trustchain: null }` for an instance that has a key but no key tree.
 *
 * @example
 * ```ts
 * const store = configureStore({
 *   reducer: { trustchain: keyRingReducer },
 *   preloadedState: { trustchain: mockKeyRingState() },
 * });
 * ```
 */
export function mockKeyRingState(overrides?: Partial<KeyRingState>): KeyRingState {
  return KeyRingStateSchema.parse({
    trustchain: mockKeyRingTreeRecord(),
    memberCredentials: mockKeyRingMemberKeyRecord(),
    ...overrides,
  });
}
