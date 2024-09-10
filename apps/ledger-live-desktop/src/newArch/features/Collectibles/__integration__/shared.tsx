import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import React from "react";
import { Switch, Route, withRouter } from "react-router";
import NftBreadCrumb from "LLD/components/BreadCrumb";
import NFTGallery from "../Nfts/screens/Gallery";
import NftCollection from "../Nfts/screens/Collection";
import NftCollections from "../Nfts/Collections";
import { account } from "./mockedAccount";
import OrdinalsAccount from "LLD/features/Collectibles/Ordinals/screens/Account";
import { MockedbtcAccount } from "./mockedBTCAccount";

const NftCollectionNavigation = () => (
  <Switch>
    <Route exact path="/" render={() => <NftCollections account={account} />} />
    <Route path="/account/:id/nft-collection/:collectionAddress" render={() => <NftCollection />} />
    <Route path="/account/:id/nft-collection" render={() => <NFTGallery />} />
  </Switch>
);

const NftCollectionTestBase = () => (
  <>
    <div id="modals"></div>
    <NftBreadCrumb />
    <NftCollectionNavigation />
  </>
);

export const NftCollectionTest = withRouter(NftCollectionTestBase);
export const NoNftCollectionTest = withRouter(() => (
  <>
    <div id="modals"></div>
    <NftBreadCrumb />
    <NftCollections account={genAccount("mockethereum")} />
  </>
));

export const BitcoinPage = () => (
  <Switch>
    <Route path="/" render={() => <OrdinalsAccount account={MockedbtcAccount} />} />
  </Switch>
);
