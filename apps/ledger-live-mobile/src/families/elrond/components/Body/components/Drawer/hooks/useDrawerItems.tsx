import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { Linking } from "react-native";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";

import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { FieldType } from "~/components/DelegationDrawer";
import type { DrawerPropsType, DrawerStatusType } from "../types";

import DateFromNow from "~/components/DateFromNow";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";

import styles from "../styles";

/*
 * Handle the hook declaration.
 */

const useDrawerItems = (data: DrawerPropsType["data"], account: ElrondAccount) => {
  const { type, validator, claimableRewards, seconds } = data;
  const { t } = useTranslation();

  const unit = useMemo(() => getAccountUnit(account), [account]);
  const [isDelegation, isUndelegation] = useMemo(
    () => [type === "delegation", type === "undelegation"],
    [type],
  );

  /*
   * Upon requesting to open the explorer, retrieve the dynamic address, and open the link.
   */

  const onExplorer = useCallback(
    (address: string) => {
      const explorer = getAddressExplorer(getDefaultExplorerView(account.currency), address);

      if (explorer) {
        Linking.openURL(explorer);
      }
    },
    [account],
  );

  /*
   * Memoize the amount of seconds left into a valid date format, relative to now.
   */

  const date = useMemo(
    () => (seconds ? new Date(new Date().getTime() + 1000 * seconds).toISOString() : false),
    [seconds],
  );

  /*
   * Memoize current status of the delegation, if it produces anything or not.
   */

  const status: DrawerStatusType = useMemo(
    () => ({
      delegation: "active",
      undelegation: "inactive",
    }),
    [],
  );

  const name = useMemo(() => validator.identity.name || validator.contract, [validator]);

  /*
   * Memoize the denominated amount of claimable rewards, if it's a delegation item.
   */

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

  /*
   * Compose the array of common items between the two types of drawers (validator name, validator address, account name and item status).
   */

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
          <Touchable event="DelegationOpenExplorer" onPress={() => onExplorer(validator.contract)}>
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
    [validator, name, t, account.name, type, status, onExplorer],
  );

  /*
   * Should the current item be a delegation, create a specific array for specific items, including only claimable rewards.
   */

  const delegationItems: FieldType[] = useMemo(
    () =>
      isDelegation
        ? [
            {
              label: t("elrond.delegation.drawer.rewards"),
              Component: (
                <LText numberOfLines={1} semiBold={true} style={styles.valueText}>
                  {`${rewards} ${unit.code}`}
                </LText>
              ),
            },
          ]
        : [],
    [isDelegation, rewards, t, unit.code],
  );

  /*
   * Should the current item be an undelegation, create a specific array for specific items, including only time remaining for completion.
   */

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

  /*
   * Conditionally and dynamically concatenate the common items' array with the specific arrays, based on array with available items.
   */

  const items = useMemo(
    () =>
      delegationItems.length
        ? commonItems.concat(delegationItems)
        : undelegationItems.length
        ? commonItems.concat(undelegationItems)
        : [],
    [commonItems, delegationItems, undelegationItems],
  );

  /*
   * Return the hook's payload.
   */

  return items;
};

export default useDrawerItems;
