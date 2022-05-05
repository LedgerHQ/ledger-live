import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "../../../components/SettingsRow";
import { carouselVisibilitySelector } from "../../../reducers/settings";
import { setCarouselVisibility } from "../../../actions/settings";
import { SLIDES } from "../../../components/Carousel/shared";

const CarouselRow = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const onSetCarouselVisibility = useCallback(
    checked =>
      dispatch(
        setCarouselVisibility(
          checked
            ? Object.fromEntries(SLIDES.map(slide => [slide.name, true]))
            : Object.fromEntries(SLIDES.map(slide => [slide.name, false])),
        ),
      ),
    [dispatch],
  );

  return (
    <SettingsRow
      event="CarouselToggleRow"
      title={t("settings.display.carousel")}
      desc={t("settings.display.carouselDesc")}
    >
      <Switch
        checked={Object.values(carouselVisibility).some(
          cardVisible => cardVisible,
        )}
        onChange={onSetCarouselVisibility}
      />
    </SettingsRow>
  );
};

export default CarouselRow;
