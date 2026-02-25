import React, { useEffect } from "react";
import { Icons, Link, Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { AppBlocker } from "LLD/features/AppBlockers/components/AppBlocker";

export function AppGeoBlocker({ children }: { children: React.ReactNode }) {
  const { data: blocked, isLoading } = ofacGeoBlockApi.useCheckQuery();

  useEffect(() => {
    if (isLoading) return;
    globalThis.api?.appLoaded();
  }, [isLoading]);

  const localizedLearnMoreUrl = useLocalizedUrl(urls.geoBlock.learnMore);

  const openUrl = () => openURL(localizedLearnMoreUrl);

  return (
    <AppBlocker
      blocked={blocked ?? false}
      IconComponent={() => (
        <Icons.DeleteCircleFill size="L" color="error.c60" data-testID="delete-icon" />
      )}
      TitleComponent={() => (
        <Text variant="bodyLineHeight" color="neutral.c100" fontSize={24} marginTop={24}>
          <Trans i18nKey="geoBlocking.title" />
        </Text>
      )}
      DescriptionComponent={() => (
        <Text variant="body" fontSize={14} color="neutral.c70" marginTop={16}>
          <Trans i18nKey="geoBlocking.description" />
        </Text>
      )}
      CTAComponent={() => (
        <Link
          size="medium"
          color="neutral.c100"
          Icon={() => <Icons.ExternalLink size="S" />}
          onClick={openUrl}
          padding={3}
          marginTop={24}
          border={1}
          borderStyle="solid"
          borderColor="opacity.c30"
          borderRadius={500}
          style={{ textDecoration: "none" }}
        >
          <Trans i18nKey="geoBlocking.learnMore" />
        </Link>
      )}
    >
      {children}
    </AppBlocker>
  );
}
