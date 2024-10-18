import React, { useState } from "react";
import { Flex, Grid, Icons, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { CircleWrapper } from "~/renderer/components/CryptoCurrencyIcon";
import { useExportLogs } from "LLD/hooks/useExportLogs";
import { TransactionBroadcastError } from "@ledgerhq/live-common/errors/transactionBroadcastErrors";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { useTranslation } from "react-i18next";
import TechnicalErrorSection from "./TechnicalErrorSection";
import HelpSection from "./HelpSection";
import TranslatedError from "~/renderer/components/TranslatedError";
import { ErrorBody } from "~/renderer/components/ErrorBody";

type Props = {
  error: TransactionBroadcastError;
};

const InteractFlex = styled(Flex)`
  &:hover {
    cursor: pointer;
  }
`;

const NodeError: React.FC<Props> = ({ error }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { handleExportLogs } = useExportLogs();

  const { coin: currencyName, network: networkName, url } = error;
  const supportUrl = url ?? urls.contactSupport;
  const localizedSupportUrl = useLocalizedUrl(supportUrl);

  const [isShowMore, setIsShowMore] = useState(true);

  const color = theme.colors.palette.opacityDefault.c05;

  const onSaveLogs = () => handleExportLogs();

  const onGetHelp = () => openURL(localizedSupportUrl);

  const onShowMore = () => setIsShowMore(!isShowMore);

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      width={"90%"}
      rowGap={32}
      flexDirection="column"
    >
      <Flex justifyContent="center" flexDirection="column">
        <ErrorBody
          title={
            <Text variant="h3Inter" fontSize={24} textAlign="center">
              <TranslatedError error={error} />
            </Text>
          }
          description={
            <Text variant="bodyLineHeight" fontSize={14} textAlign="center" color="neutral.c70">
              {t("errors.TransactionBroadcastError.description", {
                networkName,
                currencyName,
              })}
            </Text>
          }
          top={
            <CircleWrapper size={72} color={color}>
              <Icons.DeleteCircleFill size="L" color="error.c50" />
            </CircleWrapper>
          }
        />
      </Flex>
      <Flex flexDirection="column" rowGap={16} width="100%" alignItems="flex-start">
        <InteractFlex alignItems="center" onClick={onShowMore}>
          <Text variant="bodyLineHeight" fontSize={13}>
            {t("errors.TransactionBroadcastError.needHelp")}
          </Text>

          {isShowMore ? (
            <Icons.ChevronDown color="neutral.c100" size="S" />
          ) : (
            <Icons.ChevronRight color="neutral.c100" size="S" />
          )}
        </InteractFlex>
        {isShowMore && (
          <Grid columns={2} columnGap="8px" width="100%">
            <HelpSection onGetHelp={onGetHelp} />
            <TechnicalErrorSection error={error} onSaveLogs={onSaveLogs} />
          </Grid>
        )}
      </Flex>
    </Flex>
  );
};

export default NodeError;
