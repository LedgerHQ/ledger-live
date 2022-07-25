import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Alert, BottomDrawer, Button, Text, Switch } from "@ledgerhq/native-ui";
import { GraphGrowAltMedium } from "@ledgerhq/native-ui/assets/icons";
import { View } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import {
  setHasOrderedNano,
  setSensitiveAnalytics,
} from "../../../actions/settings";
import { hasOrderedNanoSelector } from "../../../reducers/settings";
import { useReboot } from "../../../context/Reboot";

const HasOrderedNanoRow = () => {
  const dispatch = useDispatch();
  const hasOrderedNano: boolean = useSelector(hasOrderedNanoSelector);
  const reboot = useReboot();

  const onChange = useCallback(
    (enabled: boolean) => {
      dispatch(setHasOrderedNano(enabled));

      if (enabled) {
        dispatch(setSensitiveAnalytics(true));
      }
    },
    [dispatch],
  );

  return (
    <>
      <SettingsRow
        event="HasOrderedNanoRowRow"
        title="HasOrderedNano mode"
        desc="Toggle HasOrderedNano mode for testing"
      >
        <Switch checked={hasOrderedNano} onChange={onChange} />
      </SettingsRow>
    </>
  );
};

export default HasOrderedNanoRow;
