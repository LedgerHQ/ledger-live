import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getsupportedCountervalues } from "~/renderer/reducers/settings";
import { setSupportedCounterValues } from "~/renderer/actions/settings";
import { selectSupportedFiats } from "@domain/entity-currency-fiat";

export const useInitSupportedCounterValues = () => {
  const dispatch = useDispatch();
  const fiats = useSelector(selectSupportedFiats);

  useEffect(() => {
    dispatch(setSupportedCounterValues(getsupportedCountervalues(fiats)));
  }, [dispatch, fiats]);
};
