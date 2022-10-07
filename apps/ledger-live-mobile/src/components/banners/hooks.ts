import { useDispatch, useSelector } from "react-redux";
import { dismissBanner } from "../../actions/settings";
import { dismissedBannersSelector } from "../../reducers/settings";

export function useBanner(bannerId: string) {
  const dispatch = useDispatch();
  const dismissedBanners = useSelector(dismissedBannersSelector);
  const isDismissed = dismissedBanners.includes(bannerId);

  const dismiss = () => dispatch(dismissBanner(bannerId));

  return [isDismissed, dismiss];
}
