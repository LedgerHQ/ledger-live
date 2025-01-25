import React from "react";
import useHiddenInscriptionsModel from "./useHiddenInscriptionsModel";
import { useTranslation } from "react-i18next";
import { SettingsSection as Section, SettingsSectionRow as Row } from "../../../SettingsSection";
import Box from "~/renderer/components/Box";
import Track from "~/renderer/analytics/Track";
import { Show, Body } from "./components/styledComponents";
import { Row as HiddenInscriptionRow } from "./components/Row";
import { Icons } from "@ledgerhq/react-ui";
type ViewProps = ReturnType<typeof useHiddenInscriptionsModel>;

function View({
  hiddenOrdinalAssets,
  sectionVisible,
  unHideInscription,
  toggleCurrencySection,
}: ViewProps) {
  const { t } = useTranslation();

  return (
    <Section
      style={{
        flowDirection: "column",
      }}
    >
      <Track onUpdate event="HiddenOrdinalsAssets dropdown" opened={sectionVisible} />
      <Row
        title={t("settings.accounts.hiddenOrdinalsAsset.title")}
        desc={t("settings.accounts.hiddenOrdinalsAsset.desc")}
        onClick={toggleCurrencySection}
        contentContainerStyle={
          hiddenOrdinalAssets.length
            ? {
                cursor: "pointer",
              }
            : undefined
        }
      >
        {hiddenOrdinalAssets.length ? (
          <Box horizontal alignItems="center">
            <Box ff="Inter" fontSize={3} mr={2}>
              {t("settings.accounts.hiddenOrdinalsAsset.count", {
                count: hiddenOrdinalAssets.length,
              })}
            </Box>
            <Show visible={sectionVisible}>
              <Icons.ChevronDown size="S" />
            </Show>
          </Box>
        ) : null}
      </Row>

      {sectionVisible && (
        <Body>
          {hiddenOrdinalAssets.map(inscriptionId => {
            return (
              <HiddenInscriptionRow
                key={inscriptionId}
                unHideInscription={() => unHideInscription(inscriptionId)}
                inscriptionId={inscriptionId}
              />
            );
          })}
        </Body>
      )}
    </Section>
  );
}

const HiddenInscriptions = () => {
  return <View {...useHiddenInscriptionsModel()} />;
};

export default HiddenInscriptions;
