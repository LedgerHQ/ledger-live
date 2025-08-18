import React, { Fragment, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { rebootIdSelector } from "../reducers/appstate";
import { reboot } from "../actions/appstate";

export default function RebootProvider({ children }: { children: React.ReactNode }) {
  const rebootId = useSelector(rebootIdSelector);

  return <Fragment key={rebootId}>{children}</Fragment>;
}

export function useReboot() {
  // TODO does this custom hook serve any value?
  const dispatch = useDispatch();

  return useCallback(
    async (resetData = false) => {
      dispatch(
        reboot({
          resetData,
        }),
      );
    },
    [dispatch],
  );
}
