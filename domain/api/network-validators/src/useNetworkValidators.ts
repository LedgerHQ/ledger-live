import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { NetworkId } from "@domain/entity-account-descriptor";
import {
  selectNetworkValidatorsEntry,
  type NetworkValidator,
  type NetworkValidatorsError,
} from "@domain/entity-network-validators";
import { fetchNetworkValidators, type NetworkValidatorsRootState } from "./fetchNetworkValidators";

export type UseNetworkValidatorsResult = {
  /** Empty until the first answer. */
  validators: NetworkValidator[];
  pending: boolean;
  /** Of the last read; the validators stored before it are kept. */
  error: NetworkValidatorsError | undefined;
};

const NO_VALIDATORS: NetworkValidator[] = [];

/** Reads a network's validators when mounted, unless fresh or in flight. */
export function useNetworkValidators(networkId: NetworkId | undefined): UseNetworkValidatorsResult {
  const dispatch = useDispatch<ThunkDispatch<NetworkValidatorsRootState, unknown, UnknownAction>>();

  useEffect(() => {
    if (networkId !== undefined) void dispatch(fetchNetworkValidators(networkId));
  }, [dispatch, networkId]);

  const entry = useSelector((state: NetworkValidatorsRootState) =>
    networkId === undefined ? undefined : selectNetworkValidatorsEntry(state, networkId),
  );
  return {
    validators: entry?.validators ?? NO_VALIDATORS,
    pending: entry?.pending !== undefined,
    error: entry?.error,
  };
}
