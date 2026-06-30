import React from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { setInfoBottomSheet, borrowInfoBottomSheetSelector } from "~/reducers/borrow";
import { InfoBottomSheet } from "~/components/WebPTXPlayer/InfoBottomSheet";

export function BorrowInfoBottomSheet() {
  const dispatch = useDispatch();
  const data = useSelector(borrowInfoBottomSheetSelector);

  const onClose = () => dispatch(setInfoBottomSheet(undefined));

  return <InfoBottomSheet data={data} onClose={onClose} />;
}
