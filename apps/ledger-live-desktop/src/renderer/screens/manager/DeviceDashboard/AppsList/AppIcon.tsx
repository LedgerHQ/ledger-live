import React, { useCallback, useState } from "react";
import styled from "styled-components";
import manager from "@ledgerhq/live-common/manager/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getValidCryptoIconSize } from "@ledgerhq/live-common/helpers/cryptoIconSize";
import { App } from "@ledgerhq/types-live";
import Image from "~/renderer/components/Image";
import ManagerAppIconPlaceholder from "~/renderer/icons/ManagerAppIcon";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

const size = 40;
const ManagerAppIconContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.2s ease-out;
  color: ${p => p.theme.colors.neutral.c40};
`;
const IconContainer = styled.div<{ size?: number | string; loading?: boolean }>`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  position: relative;
  ${ManagerAppIconContainer} {
    opacity: ${p => (p.loading ? 1 : 0)};
  }
  > img {
    transition: opacity 0.2s ease-out;
    z-index: 1;
    opacity: ${p => (p.loading ? 0 : 1)};
  }
`;
type Props = {
  app: App;
};
function AppIcon({ app }: Readonly<Props>) {
  const { currencyId, icon } = app;
  const [loading, setLoading] = useState(true);
  const onLoad = useCallback(() => setLoading(false), []);
  const iconUrl = manager.getIconUrl(icon);
  const currency = currencyId && findCryptoCurrencyById(currencyId);

  // Use new CryptoIcon if currency exists
  if (currency) {
    const ledgerId = currency.id;
    const ticker = currency.ticker;
    const validSize = getValidCryptoIconSize(size);

    return (
      <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={validSize} overridesRadius="12px" />
    );
  }

  // Fallback to manager icon for non-crypto apps
  if (!iconUrl) {
    return (
      <IconContainer loading={false} size={size}>
        <ManagerAppIconContainer>
          <ManagerAppIconPlaceholder size={size} />
        </ManagerAppIconContainer>
      </IconContainer>
    );
  }

  return (
    <IconContainer loading={loading} size={size}>
      <ManagerAppIconContainer>
        <ManagerAppIconPlaceholder size={size} />
      </ManagerAppIconContainer>
      <Image alt="" onLoad={onLoad} resource={iconUrl} width={size} height={size} />
    </IconContainer>
  );
}
export default AppIcon;
