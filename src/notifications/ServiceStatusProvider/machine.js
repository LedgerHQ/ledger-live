// @flow

import { assign, Machine } from "xstate";
import type { State } from "./types";

const initialState: State = {
  incidents: [],
  error: null,
  lastUpdateTime: null,
  isLoading: false,
};

export const serviceStatusMachine = Machine({
  id: "serviceStatus",
  initial: "updating",
  context: initialState,
  states: {
    idle: {
      after: {
        AUTO_UPDATE_DELAY: {
          target: "updating",
        },
      },
      on: {
        UPDATE_DATA: {
          target: "updating",
          actions: assign({ isLoading: true, error: null }),
        },
      },
    },
    updating: {
      invoke: {
        src: "fetchData",
        onDone: {
          target: "idle",
          actions: assign((context, { data }) => {
            const { incidents, updateTime } = data;

            return {
              incidents,
              lastUpdateTime: updateTime,
              isLoading: false,
              error: null,
            };
          }),
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
});
