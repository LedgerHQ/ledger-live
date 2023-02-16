// @flow
import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { showZeroValueOperationSelector } from "~/renderer/reducers/settings";
import { setShowZeroValueOperation } from "~/renderer/actions/settings";
import Switch from "~/renderer/components/Switch";

const ShowZeroValueOperationButton = () => {
  const showZeroValueOperation = useSelector(showZeroValueOperationSelector);
  const dispatch = useDispatch();

  const onChangeShareAnalytics = useCallback(
    (value: boolean) => {
      dispatch(setShowZeroValueOperation(value));
    },
    [dispatch],
  );

  return (
    <>
      <Switch isChecked={showZeroValueOperation} onChange={onChangeShareAnalytics} />
    </>
  );
};

export default ShowZeroValueOperationButton;
