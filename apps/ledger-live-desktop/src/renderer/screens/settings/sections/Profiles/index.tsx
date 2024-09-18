import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch, Route } from "react-router-dom";
import user from "~/helpers/user";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import SwitchProfile from "../Profiles/SwitchProfile";
export default function SectionProfile() {
  const { t } = useTranslation();
  return (
    <>
    <TrackPage category="Settings" name="Profiles" />
    <Body>
      <SwitchProfile />
    </Body>
    </>
  );
};