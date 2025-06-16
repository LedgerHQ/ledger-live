import { getEnv } from "@ledgerhq/live-env";
import { Flex, Icons, Text } from "@ledgerhq/react-ui/index";
import React, { useState } from "react";
import styled from "styled-components";
import { Collapsible } from "../../components/Collapsible";
import { SettingsSectionRow } from "../../../../../SettingsSection";
import EnableStagingNftMetadataServiceToggle from "../../../EnableStagingNftMetadataServiceToggle";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "../../components/CodeBlock";

const STAGING_URL = "https://nft.api.live.ledger-test.com";
const PRODUCTION_URL = "https://nft.api.live.ledger.com";

type Elem = {
  url: string;
  icon?: React.ReactNode;
  type: "Production" | "Staging";
};

const urls: Elem[] = [
  {
    url: PRODUCTION_URL,
    type: "Production",
  },
  {
    url: STAGING_URL,
    type: "Staging",
  },
];

export function MetadataProvider() {
  const visible = urls.length > 0;
  const { t } = useTranslation();

  const [currentUrlValue, setCurrentUrlValue] = useState(getEnv("NFT_METADATA_SERVICE"));

  return (
    <Collapsible
      title={"settings.developer.debugNfts.configuration.nms.title"}
      body={
        <>
          <SettingsSectionRow
            title={t("settings.developer.enableStagingNftMetadataService")}
            desc={t("settings.developer.enableStagingNftMetadataServiceDesc")}
          >
            <EnableStagingNftMetadataServiceToggle onChange={setCurrentUrlValue} />
          </SettingsSectionRow>

          <Container flexDirection="column" alignItems="flex-start" flex={1}>
            <Flex flexDirection="column" rowGap={2}>
              {urls.map(elem => (
                <Flex key={elem.url} alignItems="center">
                  <Flex alignItems="center" justifyContent="center">
                    {elem.url === currentUrlValue ? (
                      <Icons.CheckmarkCircleFill size="S" color="primary.c80" />
                    ) : (
                      <Icons.Minus size="S" />
                    )}
                  </Flex>
                  <Text ml={2}>
                    {t("settings.developer.debugNfts.configuration.nms.env", {
                      env: elem.type,
                    })}
                  </Text>

                  <InteractText ml={2} onClick={() => navigator.clipboard.writeText(elem.url)}>
                    <CodeBlock code={elem.url} />
                  </InteractText>
                </Flex>
              ))}
            </Flex>
          </Container>
        </>
      }
      visible={visible}
      badge={urls.length}
    />
  );
}

const Container = styled(Flex)`
  border-radius: 8px;
  padding: 10px 20px;
`;

const InteractText = styled(Text)`
  &:hover {
    cursor: pointer;
  }
`;
