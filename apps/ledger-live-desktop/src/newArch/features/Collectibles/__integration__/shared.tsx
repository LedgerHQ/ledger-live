import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import React from "react";
import { Switch, Route, withRouter, RouteComponentProps, StaticContext } from "react-router";
import NftBreadCrumb from "LLD/components/BreadCrumb";
import NFTGallery from "../Nfts/screens/Gallery";
import NftCollection from "../Nfts/screens/Collection";
import NftCollections from "../Nfts/Collections";
import { account as ethAccount } from "./mockedAccount";
import OrdinalsAccount from "LLD/features/Collectibles/Ordinals/screens/Account";
import { MockedbtcAccount } from "./mockedBTCAccount";
import { MockedTransaction } from "./mockedTx";
import { getMockedTxStatus } from "./mockedTxStatus";
import { Account } from "@ledgerhq/types-live";

const NftCollectionNavigation = ({ account }: { account?: Account }) => (
  <Switch>
    <Route exact path="/" render={() => <NftCollections account={account ?? ethAccount} />} />
    <Route path="/account/:id/nft-collection/:collectionAddress" render={() => <NftCollection />} />
    <Route path="/account/:id/nft-collection" render={() => <NFTGallery />} />
  </Switch>
);

const NftCollectionTestBase = (
  props: { account?: Account } & RouteComponentProps<never, StaticContext, unknown>,
) => (
  <>
    <div id="modals"></div>
    <NftBreadCrumb />
    <NftCollectionNavigation {...props} />
  </>
);

export const NftCollectionTest = withRouter(
  (arg: { account?: Account } & RouteComponentProps<never, StaticContext, unknown>) => {
    return <NftCollectionTestBase {...arg} />;
  },
);

export const NoNftCollectionTest = withRouter(() => (
  <>
    <div id="modals"></div>
    <NftBreadCrumb />
    <NftCollections account={genAccount("mockethereum")} />
  </>
));

export const BitcoinPage = () => (
  <>
    <div id="modals"></div>
    <Switch>
      <Route path="/" render={() => <OrdinalsAccount account={MockedbtcAccount} />} />
    </Switch>
  </>
);

export { MockedbtcAccount, MockedTransaction, getMockedTxStatus };
