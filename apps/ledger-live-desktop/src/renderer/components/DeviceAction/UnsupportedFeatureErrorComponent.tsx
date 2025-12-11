import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { Icons, Flex, Link, Text } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import Button from "../ButtonV3";
import { CircleWrapper } from "../CircleWrapper";
import { ErrorBody } from "../ErrorBody";
import ExportLogsButton from "../ExportLogsButton";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Wrapper } from "./rendering";

export function UnsupportedFeatureErrorComponent() {
  const { t } = useTranslation();
  const theme = useTheme();
  const contactSupportUrl = useLocalizedUrl(urls.contactSupport);

  const onContactSupport = useCallback(() => {
    openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return (
    <Wrapper>
      <TrackPage category="Unsupported Feature" name="Error: App Unavailable" />
      <ErrorBody
        top={
          <CircleWrapper color={theme.colors.opacityDefault.c05} size={72}>
            <Icons.DeleteCircleFill size="L" color="error.c50" />
          </CircleWrapper>
        }
        Icon={() => <Icons.DeleteCircleFill color="error.c60" size="L" />}
        title={t("errors.UnsupportedFeatureError.title")}
        description={t("errors.UnsupportedFeatureError.description")}
        buttons={
          <Flex flexDirection="column" alignItems="center" rowGap={8} width="372px">
            <Button variant="main" onClick={onContactSupport} width="100%">
              {t("errors.UnsupportedFeatureError.ctaLabel")}
            </Button>
            <ExportLogsButton
              title={t("settings.exportLogs.title")}
              customComponent={exportLogsHandler => (
                <Link
                  Icon={() => <Icons.Download size="S" />}
                  onClick={exportLogsHandler}
                  iconPosition="left"
                >
                  <Text variant="body">{t("settings.exportLogs.title")}</Text>
                </Link>
              )}
            />
          </Flex>
        }
      />
    </Wrapper>
  );
}
