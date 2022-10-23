import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import DateFromNow from "../../../../../../../components/DateFromNow";
import LText from "../../../../../../../components/LText";
import Touchable from "../../../../../../../components/Touchable";

import { constants } from "../../../../../constants";
import { denominate } from "../../../../../helpers";

import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { FieldType } from "../../../../../../../components/DelegationDrawer";
import type { DrawerPropsType, DrawerStatusType } from "../types";

import styles from "../styles";

const useDrawerItems = (
  data: DrawerPropsType["data"],
  account: ElrondAccount,
) => {
  const { type, validator, claimableRewards, seconds } = data;
  const { t } = useTranslation();

  const [isDelegation, isUndelegation] = useMemo(
    () => [type === "delegation", type === "undelegation"],
    [type],
  );

  const date = useMemo(
    () =>
      seconds
        ? new Date(new Date().getTime() + 1000 * seconds).toISOString()
        : false,
    [seconds],
  );

  const status: DrawerStatusType = useMemo(
    () => ({
      delegation: "active",
      undelegation: "inactive",
    }),
    [],
  );

  const name = useMemo(
    () => validator.identity.name || validator.contract,
    [validator],
  );

  const rewards = useMemo(
    () =>
      isDelegation && claimableRewards
        ? denominate({
            input: String(claimableRewards),
            decimals: 4,
          })
        : false,
    [isDelegation, claimableRewards],
  );

  const commonItems: FieldType[] = useMemo(
    () => [
      {
        label: t("delegation.validator"),
        Component: (
          <LText
            numberOfLines={1}
            semiBold={true}
            ellipsizeMode="middle"
            style={styles.valueText}
            color="live"
          >
            {name}
          </LText>
        ),
      },
      {
        label: t("delegation.validatorAddress"),
        Component: (
          <Touchable
            event="DelegationOpenExplorer"
            onPress={() =>
              Linking.openURL(
                `${constants.explorer}/providers/${validator.contract}`,
              )
            }
          >
            <LText
              numberOfLines={1}
              semiBold={true}
              ellipsizeMode="middle"
              style={styles.valueText}
              color="live"
            >
              {validator.contract}
            </LText>
          </Touchable>
        ),
      },
      {
        label: t("delegation.delegatedAccount"),
        Component: (
          <LText
            numberOfLines={1}
            semiBold={true}
            ellipsizeMode="middle"
            style={styles.valueText}
            color="live"
          >
            {account.name}
          </LText>
        ),
      },
      {
        label: t("elrond.delegation.drawer.status"),
        Component: (
          <LText
            numberOfLines={1}
            semiBold={true}
            ellipsizeMode="middle"
            style={styles.valueText}
            color="live"
          >
            {t(`elrond.delegation.drawer.${status[type]}`)}
          </LText>
        ),
      },
    ],
    [constants.explorer, validator, name, t, account.name, status],
  );

  const delegationItems: FieldType[] = useMemo(
    () =>
      isDelegation
        ? [
            {
              label: t("elrond.delegation.drawer.rewards"),
              Component: (
                <LText
                  numberOfLines={1}
                  semiBold={true}
                  style={styles.valueText}
                >
                  {`${rewards} ${constants.egldLabel}`}
                </LText>
              ),
            },
          ]
        : [],
    [isDelegation, rewards, t, constants.egldLabel],
  );

  const undelegationItems: FieldType[] = useMemo(
    () =>
      isUndelegation
        ? [
            {
              label: t("elrond.delegation.drawer.completionDate"),
              Component: (
                <LText numberOfLines={1} semiBold={true}>
                  {date ? (
                    <DateFromNow date={new Date(date).getTime()} />
                  ) : (
                    t("elrond.delegation.drawer.completionDateHit")
                  )}
                </LText>
              ),
            },
          ]
        : [],
    [isUndelegation, date, t],
  );

  const items = useMemo(
    () =>
      delegationItems.length
        ? commonItems.concat(delegationItems)
        : undelegationItems.length
        ? commonItems.concat(undelegationItems)
        : [],
    [commonItems, delegationItems, undelegationItems],
  );

  return items;
};

export default useDrawerItems;
