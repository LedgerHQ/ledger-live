import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Alert, BottomDrawer, Button, Text, Switch } from "@ledgerhq/native-ui";
import { GraphGrowAltMedium } from "@ledgerhq/native-ui/assets/icons";
import { View } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import { setAnalytics, setHasOrderedNano } from "../../../actions/settings";
import { analyticsEnabledSelector, hasOrderedNanoSelector } from "../../../reducers/settings";
import Track from "../../../analytics/Track";
import { useReboot } from "../../../context/Reboot";

const HasOrderedNanoRow = () => {
  const dispatch = useDispatch();
  const hasOrderedNano: boolean = useSelector(hasOrderedNanoSelector);
  const reboot = useReboot();

  return (
    <>
      <SettingsRow
        event="HasOrderedNanoRowRow"
        title="HasOrderedNano mode"
        desc="Toggle HasOrderedNano mode for testing"
      >
        <Switch
          checked={hasOrderedNano}
          onChange={value => {
            dispatch(setHasOrderedNano(value))
          }}
        />
      </SettingsRow>
    </>
  );
};

export default HasOrderedNanoRow;
