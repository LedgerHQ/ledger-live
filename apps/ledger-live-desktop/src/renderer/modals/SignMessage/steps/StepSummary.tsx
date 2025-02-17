import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { MessageProperties } from "@ledgerhq/types-live";
import React, { memo, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Text from "~/renderer/components/Text";
import { getLLDCoinFamily } from "~/renderer/families";
import IconWallet from "~/renderer/icons/Wallet";
import { rgba } from "~/renderer/styles/helpers";
import { StepProps } from "../types";
import { useAccountName } from "~/renderer/reducers/wallet";
import AngleDown from "~/renderer/icons/AngleDown";
import FormattedVal from "~/renderer/components/FormattedVal";
import { Account } from "@ledgerhq/types-live";

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

const MessageProperty = memo(
  ({
    label,
    value,
    account,
    contractAddress,
  }: MessageProperties[0] & { account?: Account; contractAddress?: string | string[] }) => {
    if (!value) return null;

    const isPropertyAmount = label.includes("Amount") && account && contractAddress;

    const unit = isPropertyAmount
      ? account.subAccounts?.find(a => a.token.contractAddress === contractAddress)?.token.units[0]
      : undefined;

    return (
      <Box
        style={{ flexDirection: "row", justifyContent: "space-between", maxWidth: "100%" }}
        flex="1"
        mb={20}
      >
        <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
          {label}
        </Text>
        <Text
          ff="Inter|Medium"
          color="palette.text.shade90"
          fontSize={3}
          pl={2}
          style={{ maxWidth: "90%" }}
        >
          {typeof value === "string" ? (
            <ValueWrapper>
              {isPropertyAmount ? (
                <>
                  <FormattedVal
                    color={"palette.neutral.c100"}
                    val={Number(value)}
                    unit={unit}
                    fontSize={3}
                    disableRounding
                    alwaysShowValue
                    showCode
                    inline
                  />
                </>
              ) : (
                value
              )}
            </ValueWrapper>
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
  },
);

MessageProperty.displayName = "MessageProperty";

const MessagePropertiesComp = memo(
  (props: { properties: MessageProperties | null } & { account: Account }) => {
    const { properties, account } = props;
    const contractAddress = properties?.find(p => p.label === "Token")?.value;

    return properties ? (
      <Box flex="1">
        {properties.map((p, i) => {
          const props = { ...p, account, contractAddress };
          return <MessageProperty key={i} {...props} />;
        })}
      </Box>
    ) : null;
  },
);
MessagePropertiesComp.displayName = "MessageProperties";

export default function StepSummary({ account, message: messageData }: StepProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const mainAccount = getMainAccount(account, null);
  const [messageFields, setMessageFields] = useState<MessageProperties | null>(null);

  const accountName = useAccountName(account);

  const isACREWithdraw = "type" in messageData && messageData.type === "Withdraw";

  useEffect(() => {
    if (messageData.standard === "EIP712") {
      const specific = getLLDCoinFamily(mainAccount.currency.family);
      specific?.message?.getMessageProperties(messageData).then(setMessageFields);
    }
  }, [account.currency.family, mainAccount, messageData, setMessageFields]);

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
              <CryptoCurrencyIcon size={14} currency={account.currency} />
            </div>
            <Text ff="Inter" color="palette.text.shade100" fontSize={4} style={{ flex: 1 }}>
              {accountName}
            </Text>
          </Box>
        </Box>
      </Box>
      <Separator color="red" />

      {!isACREWithdraw ? (
        messageData.standard === "EIP712" ? (
          <MessagePropertiesComp properties={messageFields} account={account} />
        ) : (
          <MessageProperty label={"message"} value={messageData.message} />
        )
      ) : null}

      <MessageContainer flex="1">
        {messageFields ? (
          <Box flex="1">
            <Button outline mb={2} onClick={() => setShowAdvanced(!showAdvanced)}>
              <Box style={{ transform: `rotate(${showAdvanced ? 0 : -90}deg)` }} mr={10}>
                <AngleDown size={18} />
              </Box>
              {showAdvanced
                ? `${t("signmessage.eip712.hideFullMessage")}`
                : `${t("signmessage.eip712.showFullMessage")}`}
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
      </MessageContainer>
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
        style={{ borderRadius: 20, backgroundColor: "white" }}
        color="neutral.c00"
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}
