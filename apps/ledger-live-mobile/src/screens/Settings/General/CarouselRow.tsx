import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "../../../components/SettingsRow";
import { setDismissedDynamicCards } from "../../../actions/settings";
import useDynamicContent from "../../../dynamicContent/dynamicContent";
import { track } from "../../../analytics";
import { ScreenName } from "../../../const";

const CarouselRow = () => {
  const { t } = useTranslation();
  const { walletCards, assetsCards, isAtLeastOneCardDisplayed } =
    useDynamicContent();

  const dispatch = useDispatch();
  const onSetDynamicCardsVisibility = useCallback(
    checked => {
      dispatch(
        setDismissedDynamicCards(
          checked ? [] : [...walletCards, ...assetsCards].map(card => card.id),
        ),
      );
      track("toggle_clicked", {
        toggle: "Content Cards",
        enabled: checked,
        screen: ScreenName.GeneralSettings,
      }); // TODO Handle Analytics correclty
    },
    [dispatch, walletCards, assetsCards],
  );

  return (
    <SettingsRow
      event="CarouselToggleRow"
      title={t("settings.display.carousel")}
      desc={t("settings.display.carouselDesc")}
    >
      <Switch
        checked={isAtLeastOneCardDisplayed}
        onChange={onSetDynamicCardsVisibility}
      />
    </SettingsRow>
  );
};

export default CarouselRow;
