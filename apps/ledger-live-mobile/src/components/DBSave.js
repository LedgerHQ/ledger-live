// @flow
import { useRef, useEffect, useMemo } from "react";
import identity from "lodash/identity";
import throttleFn from "lodash/throttle";
import { useSelector } from "react-redux";
import type { State } from "../reducers";

type Props<Data, Stats> = {
  throttle: number,
  lense: (s: State) => Data,
  getChangesStats: (next: State, prev: State) => Stats,
  save: (data: Data, changedStats: Stats) => Promise<void>,
};

export default function useDBSaveEffect<D, S>({
  lense,
  throttle = 500,
  save,
  getChangesStats,
}: Props<D, S>) {
  const state: State = useSelector(identity);
  const lastSavedState = useRef(state);

  // we keep an updated version of current props in "latestProps" ref
  const latestProps = useRef({ lense, save, state, getChangesStats });

  const checkForSave = useMemo(
    () =>
      // throttle allow to not spam lense and save too much because they are costly
      // nb it does not prevent race condition here. save must be idempotent and atomic
      throttleFn(async () => {
        const { lense, save, state, getChangesStats } = latestProps.current;
        const changedStats = getChangesStats(lastSavedState.current, state); // we compare last saved with latest state
        if (!changedStats) return; // if it's falsy, it means there is no changes
        await save(lense(state), changedStats); // we save it for real
        lastSavedState.current = state; // for the next round, we will be able to compare with latest successful state
      }, throttle),
    [throttle],
  );

  useFlushMechanism(checkForSave);

  // each time a prop changes, we will checkForSave
  useEffect(() => {
    latestProps.current = { lense, save, state, getChangesStats };
    checkForSave();
  }, [lense, save, state, checkForSave, getChangesStats]);
}

const flushes = [];
export const flushAll = () => Promise.all(flushes.map(flush => flush()));
function useFlushMechanism({
  flush,
  cancel,
}: {
  flush: () => void,
  cancel: () => void,
}) {
  const cancelRef = useRef(cancel);
  useEffect(
    () =>
      // eslint-disable-next-line react-hooks/exhaustive-deps
      () => cancelRef.current(),
    [cancelRef],
  );

  useEffect(() => {
    flushes.push(flush);
    return () => {
      const i = flushes.indexOf(flush);
      if (i !== -1) {
        flushes.splice(i, 1);
      }
    };
  }, [flush]);
}
