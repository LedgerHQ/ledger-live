import React from "react";
import { useTranslation } from "~/context/Locale";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { useLegacyBiometricsRow } from "LLM/features/AppLock/hooks/useLegacyBiometricsRow";

type Props = {
  iconLeft?: React.ReactNode;
};

export default function BiometricsRow({ iconLeft }: Props) {
  const { t } = useTranslation();
  const { privacy, biometricsEnabled, onValueChange } = useLegacyBiometricsRow();

  const biometricsType =
    t(`auth.enableBiometrics.${privacy?.biometricsType?.toLowerCase()}`) ?? privacy?.biometricsType;

  return (
    <>
      {privacy?.biometricsType ? (
        <>
          <SettingsRow
            event="BiometricsRow"
            iconLeft={iconLeft}
            centeredIcon
            title={t("auth.enableBiometrics.title", { biometricsType })}
            desc={t("auth.enableBiometrics.desc", { biometricsType })}
            disabled={!privacy.hasPassword}
          >
            <Switch
              checked={biometricsEnabled}
              onChange={onValueChange}
              disabled={!privacy.hasPassword}
            />
          </SettingsRow>
        </>
      ) : null}
    </>
  );
}
