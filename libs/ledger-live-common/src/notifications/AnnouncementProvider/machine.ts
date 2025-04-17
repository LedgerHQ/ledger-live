import { assign, createMachine } from "xstate";
import intersection from "lodash/intersection";
import type { State } from "./types";
const initialState: State = {
  cache: {},
  seenIds: [],
  allIds: [],
  error: null,
  lastUpdateTime: null,
  isLoading: false,
};
export const announcementMachine = createMachine(
  {
    id: "announcement",
    initial: "initializing",
    context: initialState,
    states: {
      initializing: {
        invoke: {
          src: "loadData",
          onDone: {
            target: "updating",
            actions: assign(({ event }) => {
              const { announcements, seenIds, lastUpdateTime } = event.output;
              const cache = {};
              announcements.forEach(announcement => {
                cache[announcement.uuid] = announcement;
              });
              const allIds = Object.keys(cache);
              return {
                allIds,
                cache,
                seenIds,
                lastUpdateTime,
              };
            }),
          },
        },
      },
      idle: {
        after: {
          AUTO_UPDATE_DELAY: {
            target: "updating",
          },
        },
        on: {
          UPDATE_DATA: {
            target: "updating",
            actions: assign({
              isLoading: true,
              error: null,
            }),
          },
        },
      },
      updating: {
        invoke: {
          src: "fetchData",
          input: ({ context }) => ({ allIds: context.allIds, cache: context.cache }),
          onDone: {
            target: "idle",
            actions: [
              assign(({ context, event }) => {
                const { announcements, updateTime } = event.output;
                const cache = {};
                announcements.forEach(announcement => {
                  cache[announcement.uuid] = announcement;
                });
                const allIds = Object.keys(cache);
                return {
                  cache,
                  seenIds: intersection(allIds, context.seenIds),
                  allIds,
                  lastUpdateTime: updateTime,
                  isLoading: false,
                  error: null,
                };
              }),
              "saveData",
            ],
          },
          onError: {
            target: "idle",
            actions: assign(({ event }) => ({
              error: event.error as Error,
            })),
          },
        },
      },
    },
    on: {
      SET_AS_SEEN: {
        guard: ({ context, event }) => !context.seenIds.includes(event.seenId),
        actions: ["setAsSeen", "saveData", "emitNewAnnouncement"],
      },
    },
  },
  {
    actions: {
      setAsSeen: assign(({ context, event }) => ({
        seenIds: [...context.seenIds, event.seenId],
      })),
    },
  },
);
