import { useSelector, useDispatch } from "react-redux";
import { useCryptoBanner } from "../../hooks/useCryptoBanner";
import {
  selectIsEnabled,
  selectAutoScroll,
  selectScrollSpeed,
} from "../../data-layer/entities/cryptoBanner/cryptoBannerSelectors";
import {
  toggleBanner,
  setAutoScroll,
} from "../../data-layer/entities/cryptoBanner/cryptoBannerSlice";
import { GetTopCryptosParams } from "../../data-layer/api/types";

export const useCryptoBannerViewModel = (params: GetTopCryptosParams) => {
  const dispatch = useDispatch();
  const isEnabled = useSelector(selectIsEnabled);
  const autoScroll = useSelector(selectAutoScroll);
  const scrollSpeed = useSelector(selectScrollSpeed);

  const { topCryptos, isLoading, error, refetch } = useCryptoBanner(params);

  const handleToggleBanner = () => {
    dispatch(toggleBanner());
  };

  const handleToggleAutoScroll = () => {
    dispatch(setAutoScroll(!autoScroll));
  };

  return {
    topCryptos,
    isEnabled,
    autoScroll,
    scrollSpeed,
    isLoading,
    error,
    onToggleBanner: handleToggleBanner,
    onToggleAutoScroll: handleToggleAutoScroll,
    onRefresh: refetch,
  };
};
