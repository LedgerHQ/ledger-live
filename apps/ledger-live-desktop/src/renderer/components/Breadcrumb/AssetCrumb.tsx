import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import DropDownSelector from "~/renderer/components/DropDownSelector";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import IconCheck from "~/renderer/icons/Check";
import IconAngleDown from "~/renderer/icons/AngleDown";
import IconAngleUp from "~/renderer/icons/AngleUp";
import { useDistribution } from "~/renderer/actions/general";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { Separator, Item, TextLink, AngleDown, Check } from "./common";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { DistributionItem } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type ItemShape = {
  key: string;
  label: string;
  currency: CryptoCurrency | TokenCurrency;
};

export default function AssetCrumb() {
  const { t } = useTranslation();
  const distribution = useDistribution();
  const history = useHistory();
  const { assetId } = useParams<{ assetId?: string }>();
  const renderItem = useCallback(
    ({ item, isActive }: { item: ItemShape; isActive: boolean }) => (
      <Item key={item.currency.id} isActive={isActive}>
        <CryptoCurrencyIcon size={16} currency={item.currency} />
        <Text ff={`Inter|${isActive ? "SemiBold" : "Regular"}`} fontSize={4}>
          {item.label}
        </Text>
        {isActive && (
          <Check>
            <IconCheck size={14} />
          </Check>
        )}
      </Item>
    ),
    [],
  );
  const onAccountSelected = useCallback(
    (item: ItemShape) => {
      if (!item) {
        return;
      }
      const { currency } = item;
      setTrackingSource("asset breadcrumb");
      history.push({
        pathname: `/asset/${currency.id}`,
      });
    },
    [history],
  );
  const processItemsForDropdown = useCallback(
    (items: DistributionItem[]) =>
      items.map(({ currency }) => ({
        key: currency.id,
        label: currency.name,
        currency,
      })),
    [],
  );
  const processedItems = useMemo(
    () => processItemsForDropdown(distribution.list || []),
    [distribution, processItemsForDropdown],
  );
  const activeItem = useMemo(
    () => distribution.list.find(dist => dist.currency.id === assetId),
    [assetId, distribution.list],
  );
  if (!distribution || !distribution.list) return null;
  return (
    <>
      <TextLink>
        <Button
          onClick={() => {
            setTrackingSource("asset breadcrumb");
            history.push({
              pathname: "/",
            });
          }}
        >
          {t("dashboard.title")}
        </Button>
      </TextLink>
      <Separator />
      <DropDownSelector
        items={processedItems}
        value={{
          label: activeItem ? activeItem.currency.name : "",
          key: activeItem ? activeItem.currency.id : "",
        }}
        controlled
        renderItem={renderItem}
        onChange={onAccountSelected}
      >
        {({ isOpen }) =>
          activeItem ? (
            <TextLink>
              <CryptoCurrencyIcon size={14} currency={activeItem.currency} />
              <Button>{activeItem.currency.name}</Button>
              <AngleDown>
                {isOpen ? <IconAngleUp size={16} /> : <IconAngleDown size={16} />}
              </AngleDown>
            </TextLink>
          ) : null
        }
      </DropDownSelector>
    </>
  );
}
