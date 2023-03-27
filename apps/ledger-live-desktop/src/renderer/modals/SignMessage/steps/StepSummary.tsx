import React, { memo, useEffect, useState } from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { NanoDisplayedInfoFor712, StepProps } from "../types";
import Button from "~/renderer/components/Button";
import { rgba } from "~/renderer/styles/helpers";
import IconWallet from "~/renderer/icons/Wallet";
import { getMessageProperties } from "../utils";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";

const Circle = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 32px;
  background-color: ${p => rgba(p.theme.colors.palette.primary.main, 0.1)};
  color: ${p => p.theme.colors.palette.primary.main};
  align-items: center;
  display: flex;
  justify-content: center;
  margin-right: 12px;
`;

const Separator = styled.div`
  height: 1px;
  background-color: rgba(20, 37, 51, 0.2);
  margin-top: 32px;
  margin-bottom: 32px;
`;

const MessageContainer = styled(Box)`
  white-space: pre;
`;
const PropertiesList = styled.ul`
  list-style: none;
  margin-bottom: 10px;
`;
const ValueWrapper = styled.span`
  margin-bottom: 6px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: normal;
`;
const AdvancedMessageArea = styled.pre`
  border: 1px solid ${p => rgba(p.theme.colors.palette.primary.main, 0.1)};
  background-color: ${p => p.theme.colors.palette.background.default};
  color: ${p => p.theme.colors.palette.text.shade80};
  font-size: 9px;
  font-family: monospace;
  overflow-wrap: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
  padding: 10px;
`;

const MessageProperty = memo(({ label, value }: { label: string; value: string | string[] }) => {
  if (!value) return null;

  return (
    <Box flex="1" mb={20}>
      <Text ff="Inter|Medium" bold color="palette.text.shade40" fontSize={4}>
        {label}
      </Text>
      <Text ff="Inter|Medium" color="palette.text.shade90" fontSize={3} pl={2}>
        {typeof value === "string" ? (
          <ValueWrapper>{value}</ValueWrapper>
        ) : (
          <PropertiesList>
            {value?.map?.((v, i) => (
              <li key={i}>
                <ValueWrapper>{`${v}${i < value.length - 1 ? "," : ""}`}</ValueWrapper>
              </li>
            ))}
          </PropertiesList>
        )}
      </Text>
    </Box>
  );
});
MessageProperty.displayName = "MessageProperty";

const MessageProperties = memo(
  (props: { properties: { label: string; value: string | string[] }[] }) => {
    const { properties } = props;
    return (
      <Box flex="1">
        {properties.map((p, i) => (
          <MessageProperty key={i} {...p} />
        ))}
      </Box>
    );
  },
);
MessageProperties.displayName = "MessageProperties";

export default function StepSummary({ account, message: messageData }: StepProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const mainAccount = getMainAccount(account, null);

  const [messageProperties, setMessageProperties] = useState<{
    message?: string;
    fields?: NanoDisplayedInfoFor712;
  }>({});

  useEffect(() => {
    getMessageProperties(mainAccount.currency, messageData).then(setMessageProperties);
  }, [mainAccount.currency, messageData, setMessageProperties]);

  const { message, fields } = messageProperties;

  return (
    <Box flow={1}>
      <Box horizontal alignItems="center">
        <Circle>
          <IconWallet size={14} />
        </Circle>
        <Box flex="1">
          <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
            <Trans i18nKey="send.steps.details.from" />
          </Text>
          <Box horizontal alignItems="center">
            <div style={{ marginRight: 7 }}>
              <CryptoCurrencyIcon size={16} currency={account.currency} />
            </div>
            <Text ff="Inter" color="palette.text.shade100" fontSize={4} style={{ flex: 1 }}>
              {account.name}
            </Text>
          </Box>
        </Box>
      </Box>
      <Separator />

      {message ? (
        <>
          <MessageContainer flex="1">
            {fields ? (
              <MessageProperties properties={fields} />
            ) : (
              <MessageProperty label={"message"} value={message || ""} />
            )}
          </MessageContainer>

          {fields ? (
            <Box flex="1">
              <Button outline small mb={2} onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced
                  ? `- ${t("signmessage.eip712.hideFullMessage")}`
                  : `+ ${t("signmessage.eip712.showFullMessage")}`}
              </Button>
              {showAdvanced ? (
                <AdvancedMessageArea>
                  {typeof messageData.message === "string"
                    ? `"${messageData.message}"`
                    : JSON.stringify(messageData.message, null, 2)}
                </AdvancedMessageArea>
              ) : null}
            </Box>
          ) : null}
        </>
      ) : null}
    </Box>
  );
}

export function StepSummaryFooter({ transitionTo }: StepProps) {
  return (
    <Box horizontal justifyContent="flex-end">
      <Button
        onClick={() => {
          transitionTo("sign");
        }}
        primary
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
