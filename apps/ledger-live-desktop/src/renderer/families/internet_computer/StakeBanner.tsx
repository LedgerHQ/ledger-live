import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React, { useCallback, useState } from "react";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getBannerState } from "@ledgerhq/live-common/families/internet_computer/utils";

const StakeBanner: React.FC<{ account: ICPAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const [bannerState, setBannerState] = useState(getBannerState(account));

  const updateBanner = useCallback(() => {
    setBannerState(getBannerState(account));
  }, [account]);

  const onClickManageNeurons = useCallback(
    (refresh = false) => {
      if (account.type !== "Account") return;
      dispatch(
        openModal("MODAL_ICP_LIST_NEURONS", {
          account,
          refresh,
        }),
      );
      updateBanner();
    },
    [account, dispatch, updateBanner],
  );

  const onClickStakeIcp = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        account,
        onConfirmationHandler: () =>
          dispatch(
            openModal("MODAL_ICP_LIST_NEURONS", {
              account,
              refresh: false,
              lastManageAction: "create_neuron",
              stepId: "confirmation",
            }),
          ),
        transaction: {
          ...initTx,
          type: "create_neuron",
        },
      }),
    );
    updateBanner();
  }, [account, dispatch, updateBanner]);

  const onClickConfirmFollowing = useCallback(() => {
    dispatch(
      openModal("MODAL_ICP_REFRESH_VOTING_POWER", {
        account,
      }),
    );
    updateBanner();
  }, [account, dispatch, updateBanner]);

  if (!stakeAccountBanner?.enabled) return null;
  const { state, data } = bannerState;

  const bannerContent = {
    confirm_following: {
      title: t("internetComputer.stakeBanner.confirmFollowing.title"),
      description:
        data?.days || data?.minutes
          ? t("internetComputer.stakeBanner.confirmFollowing.description1", {
              days: data.days,
              hours: data.hours,
            })
          : t("internetComputer.stakeBanner.confirmFollowing.description2"),
      cta: t("internetComputer.stakeBanner.confirmFollowing.cta"),
      action: onClickConfirmFollowing,
    },
    sync_neurons: {
      title: t("internetComputer.stakeBanner.syncNeurons.title"),
      description: data
        ? t("internetComputer.stakeBanner.syncNeurons.description1", {
            days: data.days,
            hours: data.hours,
          })
        : t("internetComputer.stakeBanner.syncNeurons.description2"),
      cta: t("internetComputer.stakeBanner.syncNeurons.cta"),
      action: () => onClickManageNeurons(true),
    },
    lock_neurons: {
      title: t("internetComputer.stakeBanner.lockNeurons.title"),
      description: t("internetComputer.stakeBanner.lockNeurons.description"),
      cta: t("internetComputer.stakeBanner.lockNeurons.cta"),
      // action: () => onClickManageNeurons(false),
      action: () => onClickConfirmFollowing(),
    },
    add_followees: {
      title: t("internetComputer.stakeBanner.addFollowees.title"),
      description: t("internetComputer.stakeBanner.addFollowees.description"),
      cta: t("internetComputer.stakeBanner.addFollowees.cta"),
      action: () => onClickManageNeurons(false),
    },
    stake_icp: {
      title: t("internetComputer.stakeBanner.stakeICP.title"),
      description: t("internetComputer.stakeBanner.stakeICP.description"),
      cta: t("internetComputer.stakeBanner.stakeICP.cta"),
      action: () => onClickStakeIcp(),
    },
  };

  const content = bannerContent[state];

  return (
    <AccountBanner
      title={content.title}
      description={content.description}
      cta={content.cta}
      onClick={content.action}
      display={true}
      linkText={t("common.learnMoreWithEllipsis")}
      linkUrl="https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/neurons/staking-voting-rewards"
    />
  );
};

export default StakeBanner;
