import { RecentAddressesState } from "@ledgerhq/types-live";
import {
  DistantRecentAddressesState,
  toDistantState,
  toState,
} from "../../modules/recentAddresses";

export const emptyState = {};

export const genState = (index: number) => {
  const recentAddressesState: RecentAddressesState = {};

  for (let i = 0; i < index + 1; i++) {
    recentAddressesState["currency-" + i.toString()] = [];
    for (let j = 0; j < 12; j++) {
      recentAddressesState["currency-" + i.toString()].push(`some random address at index ${j}`);
    }
  }

  return recentAddressesState;
};

export const convertLocalToDistantState = (localState: RecentAddressesState) =>
  toDistantState(localState);

export const convertDistantToLocalState = (distantState: DistantRecentAddressesState) =>
  toState(distantState);

export const similarLocalState = (
  state: RecentAddressesState,
  otherState: RecentAddressesState,
) => {
  const stateKeys = Object.keys(state);
  const otherStateKeys = Object.keys(otherState);
  return (
    stateKeys.length === otherStateKeys.length &&
    otherStateKeys.every(key => {
      return (
        state[key] &&
        state[key].length === otherState[key].length &&
        otherState[key].every(address => state[key].includes(address))
      );
    })
  );
};
