import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { informationCenterStateSelector } from "~/renderer/reducers/UI";
import { closeInformationCenter } from "~/renderer/actions/UI";

export function useInformationCenter() {
  const dispatch = useDispatch();
  const { isOpen } = useSelector(informationCenterStateSelector);
  const onRequestClose = useCallback(() => dispatch(closeInformationCenter()), [dispatch]);

  return { isOpen, onRequestClose };
}
