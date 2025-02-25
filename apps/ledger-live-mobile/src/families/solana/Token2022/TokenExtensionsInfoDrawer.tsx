import React from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { ScrollView } from "react-native";
import { bpsToPercent } from "@ledgerhq/live-common/families/solana/token";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  SolanaTokenAccount,
  SolanaTokenAccountExtensions,
} from "@ledgerhq/live-common/families/solana/types";
import { Box, Text } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";
import CopyButton from "~/newArch/components/CopyButton";

type Props = {
  tokenAccount: SolanaTokenAccount;
  extensions: SolanaTokenAccountExtensions;
  isOpen: boolean;
  closeDrawer: () => void;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text mb={3} variant={"h5"} fontWeight="semiBold" color={"neutral.c100"}>
      {children}
    </Text>
  );
};

const Paragraph = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text mb={2} variant={"paragraph"} color={"neutral.c100"}>
      {children}
    </Text>
  );
};

const ExtensionBox = ({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Box paddingTop={6} paddingBottom={3}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </Box>
  );
};

function TokenExtensionsInfoDrawer({ tokenAccount, extensions, isOpen, closeDrawer }: Props) {
  const { t } = useTranslation();
  const unit = tokenAccount.token.units[0];
  return (
    <QueuedDrawer
      title={t("solana.token.extensionsInfo.title")}
      isRequestingToBeOpened={isOpen}
      onClose={closeDrawer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Paragraph>{t("solana.token.extensionsInfo.commonInfo")}</Paragraph>

        {!!extensions.nonTransferable && (
          <ExtensionBox title={t("solana.token.extensionsInfo.nonTransferable.title")}>
            <Paragraph>{t("solana.token.extensionsInfo.nonTransferable.description")}</Paragraph>
          </ExtensionBox>
        )}

        {!!extensions.interestRate && (
          <ExtensionBox title={t("solana.token.extensionsInfo.interestBearing.title")}>
            <Paragraph>{t("solana.token.extensionsInfo.interestBearing.description")}</Paragraph>
            {extensions.interestRate.rateBps > 0 ? (
              <Paragraph>
                {t("solana.token.extensionsInfo.interestBearing.currentInterestRate", {
                  rate: bpsToPercent(extensions.interestRate.rateBps),
                })}{" "}
                {!!extensions.interestRate.accruedDelta && (
                  <>
                    {t("solana.token.extensionsInfo.interestBearing.accruedDelta", {
                      delta: formatCurrencyUnit(
                        unit,
                        new BigNumber(extensions.interestRate.accruedDelta),
                        {
                          disableRounding: true,
                          alwaysShowSign: false,
                          showCode: true,
                        },
                      ),
                    })}
                  </>
                )}
              </Paragraph>
            ) : (
              <Paragraph>
                {t("solana.token.extensionsInfo.interestBearing.interestRateNotSetup")}
              </Paragraph>
            )}
          </ExtensionBox>
        )}

        {!!extensions.permanentDelegate && (
          <ExtensionBox title={t("solana.token.extensionsInfo.permanentDelegate.title")}>
            <Paragraph>{t("solana.token.extensionsInfo.permanentDelegate.description")}</Paragraph>
            {extensions.permanentDelegate.delegateAddress ? (
              <Paragraph>
                {t("solana.token.extensionsInfo.permanentDelegate.permanentDelegateAddress", {
                  address: extensions.permanentDelegate.delegateAddress,
                })}
                <CopyButton text={extensions.permanentDelegate.delegateAddress} />
              </Paragraph>
            ) : (
              <Paragraph>
                {t("solana.token.extensionsInfo.permanentDelegate.permanentDelegateNotSetup")}
              </Paragraph>
            )}
          </ExtensionBox>
        )}

        {!!extensions.transferFee && (
          <ExtensionBox title={t("solana.token.extensionsInfo.transferFee.title")}>
            <Paragraph>{t("solana.token.extensionsInfo.transferFee.description")}</Paragraph>
            <Paragraph>
              {t("solana.token.extensionsInfo.transferFee.currentTransferFee", {
                feePercent: bpsToPercent(extensions.transferFee.feeBps),
                feeBps: extensions.transferFee.feeBps,
                maxFee: formatCurrencyUnit(unit, new BigNumber(extensions.transferFee.maxFee), {
                  disableRounding: true,
                  alwaysShowSign: false,
                  showCode: true,
                }),
              })}
            </Paragraph>
          </ExtensionBox>
        )}

        {!!extensions.transferHook && (
          <ExtensionBox title={t("solana.token.extensionsInfo.transferHook.title")}>
            <Paragraph>{t("solana.token.extensionsInfo.transferHook.description")}</Paragraph>
            {extensions.transferHook.programAddress ? (
              <Paragraph>
                {t("solana.token.extensionsInfo.transferHook.transferHookAddress", {
                  address: extensions.transferHook.programAddress,
                })}
                <CopyButton text={extensions.transferHook.programAddress} />
              </Paragraph>
            ) : (
              <Paragraph>
                {t("solana.token.extensionsInfo.transferHook.transferHookNotSetup")}
              </Paragraph>
            )}
          </ExtensionBox>
        )}
      </ScrollView>
    </QueuedDrawer>
  );
}
export default TokenExtensionsInfoDrawer;
