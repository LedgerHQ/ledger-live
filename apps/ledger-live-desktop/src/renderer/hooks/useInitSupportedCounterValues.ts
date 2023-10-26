import { useDispatch } from "react-redux";
import { getsupportedCountervalues } from "~/renderer/reducers/settings";
import { setSupportedCounterValues } from "~/renderer/actions/settings";

export const useInitSupportedCounterValues = async () => {
  const dispatch = useDispatch();

  const supportedCounterValues = await getsupportedCountervalues();
  dispatch(setSupportedCounterValues(supportedCounterValues));
};
