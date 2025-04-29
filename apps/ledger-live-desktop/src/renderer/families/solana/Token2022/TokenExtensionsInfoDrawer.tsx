import React from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { bpsToPercent } from "@ledgerhq/live-common/families/solana/token";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  SolanaTokenAccount,
  SolanaTokenAccountExtensions,
} from "@ledgerhq/live-common/families/solana/types";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import Fees from "~/renderer/icons/Fees";
import Coins from "~/renderer/icons/Coins";
import LockCircle from "~/renderer/icons/LockCircle";
import Transfer from "~/renderer/icons/Transfer";
import LightBulb from "~/renderer/icons/LightBulb";

type Props = {
  tokenAccount: SolanaTokenAccount;
  extensions: SolanaTokenAccountExtensions;
  isOpen: boolean;
  closeDrawer: () => void;
};

const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => {
  return (
    <Box alignItems="center" horizontal gap="4px" mb={2}>
      {icon}
      <Text fontSize={16}>
        <strong>{children}</strong>
      </Text>
    </Box>
  );
};

const Paragraph = ({
  style,
  children,
}: {
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => {
  return (
    <Text style={style} fontSize={13} mb={2}>
      {children}
    </Text>
  );
};

const ExtensionBox = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Box py={2}>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {children}
    </Box>
  );
};

function TokenExtensionsInfoDrawer({ tokenAccount, extensions, isOpen, closeDrawer }: Props) {
  const { t } = useTranslation();
  const unit = tokenAccount.token.units[0];
  return (
    <SideDrawer
      title={t("solana.token.extensionsInfo.title")}
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      direction="left"
    >
      <Box overflow="auto" height="calc(100% - 62px)" px={40}>
        <Paragraph>{t("solana.token.extensionsInfo.commonInfo")}</Paragraph>

        {!!extensions.nonTransferable && (
          <ExtensionBox
            icon={<LockCircle size={16} />}
            title={t("solana.token.extensionsInfo.nonTransferable.title")}
          >
            <Paragraph>{t("solana.token.extensionsInfo.nonTransferable.description")}</Paragraph>
          </ExtensionBox>
        )}

        {!!extensions.interestRate && (
          <ExtensionBox
            icon={<Coins size={16} />}
            title={t("solana.token.extensionsInfo.interestBearing.title")}
          >
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
          <ExtensionBox
            icon={<LightBulb size={16} />}
            title={t("solana.token.extensionsInfo.permanentDelegate.title")}
          >
            <Paragraph>{t("solana.token.extensionsInfo.permanentDelegate.description")}</Paragraph>
            {extensions.permanentDelegate.delegateAddress ? (
              <Paragraph style={{ wordBreak: "break-all" }}>
                {t("solana.token.extensionsInfo.permanentDelegate.permanentDelegateAddress", {
                  address: extensions.permanentDelegate.delegateAddress,
                })}
                <span style={{ marginLeft: 4, display: "inline-block" }}>
                  <CopyWithFeedback text={extensions.permanentDelegate.delegateAddress} />
                </span>
              </Paragraph>
            ) : (
              <Paragraph>
                {t("solana.token.extensionsInfo.permanentDelegate.permanentDelegateNotSetup")}
              </Paragraph>
            )}
          </ExtensionBox>
        )}

        {!!extensions.transferFee && (
          <ExtensionBox
            icon={<Fees size={16} />}
            title={t("solana.token.extensionsInfo.transferFee.title")}
          >
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
          <ExtensionBox
            icon={<Transfer size={16} />}
            title={t("solana.token.extensionsInfo.transferHook.title")}
          >
            <Paragraph>{t("solana.token.extensionsInfo.transferHook.description")}</Paragraph>
            {extensions.transferHook.programAddress ? (
              <Paragraph style={{ wordBreak: "break-all" }}>
                {t("solana.token.extensionsInfo.transferHook.transferHookAddress", {
                  address: extensions.transferHook.programAddress,
                })}
                <span style={{ marginLeft: 4, display: "inline-block" }}>
                  <CopyWithFeedback text={extensions.transferHook.programAddress} />
                </span>
              </Paragraph>
            ) : (
              <Paragraph>
                {t("solana.token.extensionsInfo.transferHook.transferHookNotSetup")}
              </Paragraph>
            )}
          </ExtensionBox>
        )}
      </Box>
    </SideDrawer>
  );
}
export default TokenExtensionsInfoDrawer;
