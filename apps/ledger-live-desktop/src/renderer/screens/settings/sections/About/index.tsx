import React, { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { getEnv } from "@ledgerhq/live-env";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import RowItem from "../../RowItem";
import ReleaseNotesButton from "./ReleaseNotesButton";
import { setDeveloperMode } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { v4 as uuidv4 } from "uuid";
import { developerModeSelector } from "~/renderer/reducers/settings";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import styled, { keyframes } from "styled-components";

const floatUp = keyframes`
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
`;

const GooseContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
`;

const GooseEmoji = styled.div<{ delay: number; left: number }>`
  position: absolute;
  font-size: 48px;
  left: ${props => props.left}%;
  animation: ${floatUp} 3s ease-out ${props => props.delay}s forwards;
`;

const SectionHelp = () => {
  const { t } = useTranslation();
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);
  const urlTerms = useLocalizedUrl(urls.terms);
  const devMode = useSelector(developerModeSelector);
  const dispatch = useDispatch();
  const { pushToast } = useToasts();
  const version = getEnv("PLAYWRIGHT_RUN") ? "0.0.0" : __APP_VERSION__;
  const [clickCounter, setClickCounter] = useState(0);
  const [showGeese, setShowGeese] = useState(false);
  const onVersionClick = useCallback(() => {
    if (clickCounter < 10) {
      setClickCounter(counter => counter + 1);
    }
  }, [clickCounter]);
  useEffect(() => {
    if (clickCounter === 10 && !devMode) {
      dispatch(setDeveloperMode(true));
      pushToast({
        id: uuidv4(),
        type: "achievement",
        title: t("settings.developer.toast.title"),
        text: t("settings.developer.toast.text"),
        icon: "info",
      });
    }
    if (clickCounter === 10 && devMode) {
      setShowGeese(true);
      setTimeout(() => setShowGeese(false), 5000); // Hide after 5 seconds
    }
  }, [clickCounter, devMode, pushToast, t, dispatch]);

  const renderGeese = () => {
    if (!showGeese) return null;
    
    const geese = [];
    for (let i = 0; i < 20; i++) {
      geese.push(
        <GooseEmoji
          key={i}
          delay={i * 0.1}
          left={Math.random() * 90 + 5}
        >
          🪿
        </GooseEmoji>
      );
    }
    
    return <GooseContainer>{geese}</GooseContainer>;
  };

  return (
    <>
      {renderGeese()}
      <TrackPage category="Settings" name="About" />
      <Body>
        <Row
          dataTestId="version-row"
          title={t("settings.help.version")}
          desc={`Ledger Live ${version}`}
          onClick={onVersionClick}
        >
          <ReleaseNotesButton />
        </Row>

        <RowItem
          title={t("settings.help.terms")}
          desc={t("settings.help.termsDesc")}
          dataTestId="terms-of-use"
          url={urlTerms}
        />

        <RowItem
          title={t("settings.help.privacy")}
          desc={t("settings.help.privacyDesc")}
          dataTestId="privacy-policy"
          url={privacyPolicyUrl}
        />
      </Body>
    </>
  );
};
export default SectionHelp;
