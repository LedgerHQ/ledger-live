import React from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { makeSetEarnInfoBottomSheetAction } from "~/actions/earn";
import { earnInfoBottomSheetSelector } from "~/reducers/earn";
import { InfoBottomSheet } from "~/components/WebPTXPlayer/InfoBottomSheet";

export function EarnInfoBottomSheet() {
  const dispatch = useDispatch();
  const data = useSelector(earnInfoBottomSheetSelector);

  const onClose = () => dispatch(makeSetEarnInfoBottomSheetAction(undefined));

  return <InfoBottomSheet data={data} onClose={onClose} />;
}
