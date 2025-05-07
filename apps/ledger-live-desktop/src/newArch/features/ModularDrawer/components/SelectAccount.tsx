import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountList } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { SelectAccount as SelectAccountButton } from "@ledgerhq/react-ui/pre-ldls";

type Props = {
  asset: CryptoOrTokenCurrency;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  source: string;
  flow: string;
};

export const SelectAccount = ({ asset, onAccountSelected, source, flow }: Props) => {
  const getAccountsByAsset = () => {
    // TODO: To be implemented in LIVE-17272
    return Array.from({ length: 50 }, (_, i) => ({
      name: `${asset.name} ${i}`,
      id: `btc${i}`,
      ticker: "BTC",
      balance: "0.004 BTC",
      fiatValue: "£288.53",
      protocol: "Native Segwit",
      address: "aJf2...ffa3d",
    }));
  };

  const onSelectAccountClicked = () => {
    // TODO: To be implemented in LIVE-17272
    track("button_clicked", {
      button: "Add a new account",
      page: "Modular Account Selection",
      flow,
    });
  };

  const onClick = (networkId: string) => {
    track("account_clicked", { currency: networkId, page: "Modular Account Selection", flow });
    onAccountSelected({} as AccountLike, {} as Account);
  };

  return (
    <>
      <TrackPage category={source} name="Modular Account Selection" flow={flow} />
      <SelectAccountButton onClick={onSelectAccountClicked} />
      <div style={{ flex: "1 1 auto", width: "100%" }}>
        <AccountList accounts={getAccountsByAsset()} onClick={onClick} />
      </div>
    </>
  );
};
