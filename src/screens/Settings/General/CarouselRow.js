/* @flow */
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import SettingsRow from "../../../components/SettingsRow";
import { carouselVisibilitySelector } from "../../../reducers/settings";
import { setCarouselVisibility } from "../../../actions/settings";
import { CAROUSEL_NONCE } from "../../../components/Carousel";
import Switch from "../../../components/Switch";

const CarouselRow = () => {
  const dispatch = useDispatch();
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const onSetCarouselVisibility = useCallback(
    checked => dispatch(setCarouselVisibility(checked ? 0 : CAROUSEL_NONCE)),
    [dispatch],
  );

  return (
    <SettingsRow
      event="CarouselToggleRow"
      title={<Trans i18nKey="settings.display.carousel" />}
      desc={<Trans i18nKey="settings.display.carouselDesc" />}
      onPress={null}
      alignedTop
    >
      <Switch
        style={{ opacity: 0.99 }}
        value={carouselVisibility !== CAROUSEL_NONCE}
        onValueChange={onSetCarouselVisibility}
      />
    </SettingsRow>
  );
};

export default CarouselRow;
