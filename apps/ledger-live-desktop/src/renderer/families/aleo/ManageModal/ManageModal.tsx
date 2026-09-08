import React from "react";
import { Trans, useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import ToolTip from "~/renderer/components/Tooltip";
import IconCoins from "~/renderer/icons/Coins";
import UnbondIcon from "~/renderer/icons/Undelegate";
import ClaimRewardIcon from "~/renderer/icons/ClaimReward";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { Account } from "@ledgerhq/types-live";
import * as S from "./ManageModal.styles";

export type Data = {
  account: AleoAccount;
  parentAccount?: Account;
  source?: string;
};

const ManageModal = ({
  account: _account,
  parentAccount: _parentAccount,
  source: _source,
  ...rest
}: Data) => {
  const { t } = useTranslation();

  return (
    <Modal
      {...rest}
      name="MODAL_ALEO_MANAGE"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="aleo.manage.title" />}
          render={() => (
            <Box>
              <ToolTip
                content={t("aleo.manage.comingSoonTooltip")}
                containerStyle={{ width: "100%" }}
              >
                <S.ManageButton data-testid="aleo-bond-button" disabled>
                  <S.IconWrapper>
                    <IconCoins size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="aleo.manage.bond.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="aleo.manage.bond.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
              </ToolTip>
              <ToolTip
                content={t("aleo.manage.comingSoonTooltip")}
                containerStyle={{ width: "100%" }}
              >
                <S.ManageButton data-testid="aleo-unbond-button" disabled>
                  <S.IconWrapper>
                    <UnbondIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="aleo.manage.unbond.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="aleo.manage.unbond.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
              </ToolTip>
              <ToolTip
                content={t("aleo.manage.comingSoonTooltip")}
                containerStyle={{ width: "100%" }}
              >
                <S.ManageButton data-testid="aleo-claim-button" disabled>
                  <S.IconWrapper>
                    <ClaimRewardIcon size={16} />
                  </S.IconWrapper>
                  <S.InfoWrapper>
                    <S.Title>
                      <Trans i18nKey="aleo.manage.claim.title" />
                    </S.Title>
                    <S.Description>
                      <Trans i18nKey="aleo.manage.claim.description" />
                    </S.Description>
                  </S.InfoWrapper>
                </S.ManageButton>
              </ToolTip>
            </Box>
          )}
          renderFooter={undefined}
        />
      )}
    />
  );
};

export default ManageModal;
