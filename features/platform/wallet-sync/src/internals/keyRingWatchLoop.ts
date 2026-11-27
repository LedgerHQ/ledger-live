import type { ZodType } from "zod";
import { classifyKeyRingError, type KeyRingStream } from "@features/platform-key-ring";
import type { KeyRingCloudSync } from "../cloudSync/keyRingCloudSync";
import type { WatchLoopHandle } from "../watchLoop/types";
import { runWatchLoop, type RunWatchLoopParams } from "./watchLoop";

/** The watch loop on a key ring stream. Refreshes on an `outdated` or `member-removed` error. */
export function createKeyRingWatchLoop<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState,
>({
  cloudSync,
  stream,
  ...rest
}: KeyRingWatchLoopParams<UserState, LocalState, Update, Schema, DistantState>): WatchLoopHandle {
  return runWatchLoop({
    ...rest,
    transport: {
      pull() {
        return cloudSync.pull(stream);
      },
      push(nextState) {
        return cloudSync.push(stream, nextState);
      },
      listenNotifications() {
        return cloudSync.listenNotifications(stream);
      },
    },
    needsRefresh: isRotationOrRemoval,
  });
}

function isRotationOrRemoval(error: unknown): boolean {
  const category = classifyKeyRingError(error);
  return category === "member-removed" || category === "outdated";
}

type KeyRingWatchLoopParams<
  UserState,
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState,
> = Omit<
  RunWatchLoopParams<UserState, LocalState, Update, Schema, DistantState>,
  "transport" | "needsRefresh"
> & {
  cloudSync: KeyRingCloudSync<DistantState>;
  stream: KeyRingStream;
};
