import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getsupportedCountervalues } from "~/renderer/reducers/settings";
import { setSupportedCounterValues } from "~/renderer/actions/settings";

export const useInitSupportedCounterValues = async () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      const supportedCounterValues = await getsupportedCountervalues();
      dispatch(setSupportedCounterValues(supportedCounterValues));
    };
    fetchData();
  }, [dispatch]);
};
