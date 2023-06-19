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
        // @ts-expect-error xstate bindings updates caused this error
        invoke: {
          src: "loadData",
          onDone: {
            target: "updating",
            actions: assign((_, { data }) => {
              const { announcements, seenIds, lastUpdateTime } = data;
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
        // @ts-expect-error xstate bindings updates caused this error
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
        // @ts-expect-error xstate bindings updates caused this error
        invoke: {
          src: "fetchData",
          onDone: {
            target: "idle",
            actions: [
              assign((context: any, { data }: any) => {
                const { announcements, updateTime } = data;
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
            actions: assign((_, { data }) => ({
              error: data,
            })),
          },
        },
      },
    },
    on: {
      SET_AS_SEEN: {
        cond: (context: any, event: any) => !context.seenIds.includes(event.seenId),
        actions: ["setAsSeen", "saveData", "emitNewAnnouncement"],
      },
    },
  },
  {
    actions: {
      setAsSeen: assign((context: any, event: any) => ({
        seenIds: [...context.seenIds, event.seenId],
      })),
    },
  },
);
