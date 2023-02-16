// @flow
import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { hideZeroValueOperationSelector } from "~/renderer/reducers/settings";
import { setHideZeroValueOperation } from "~/renderer/actions/settings";
import Switch from "~/renderer/components/Switch";

const HideZeroValueOperationButton = () => {
  const hideZeroValueOperation = useSelector(hideZeroValueOperationSelector);
  const dispatch = useDispatch();

  const onChangeShareAnalytics = useCallback(
    (value: boolean) => {
      dispatch(setHideZeroValueOperation(value));
    },
    [dispatch],
  );

  return (
    <>
      <Switch isChecked={hideZeroValueOperation} onChange={onChangeShareAnalytics} />
    </>
  );
};

export default HideZeroValueOperationButton;
