// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "../live-common-setup";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";

const xpub =
  "xpub6BemYiVNp19a2U7pwWxgVippXMMePBb4UPxET8uKqky7Fr8qs1Dky1QCacsxNFDHogrueJQ144fcsZcukMBw9NovgBvFnUcjHYPCq7AWjzj";

withLibcore(async core => {
  const pool = core.getPoolInstance();
  const config = await core.DynamicObject.newInstance();
  await config.putString(
    "KEYCHAIN_DERIVATION_SCHEME",
    "44'/60'/<account>'/<node>/<address>"
  );
  await config.putString(
    "BLOCKCHAIN_EXPLORER_API_ENDPOINT",
    "http://eth-mainnet.explorers.dev.aws.ledger.fr"
  );
  await config.putString("BLOCKCHAIN_EXPLORER_VERSION", "v3");
  const currency = await pool.getCurrency("ethereum");
  let wallet;
  const walletName = `${xpub}_playground`;
  try {
    wallet = await pool.getWallet(walletName);
  } catch (e) {
    wallet = await pool.createWallet(walletName, currency, config);
  }

  let account;
  try {
    account = await wallet.getAccount(0);
  } catch (e) {
    const extendedInfos = await wallet.getExtendedKeyAccountCreationInfo(0);
    const infosIndex = await extendedInfos.getIndex();
    const extendedKeys = await extendedInfos.getExtendedKeys();
    const owners = await extendedInfos.getOwners();
    const derivations = await extendedInfos.getDerivations();
    extendedKeys.push(xpub);
    const newExtendedKeys = await core.ExtendedKeyAccountCreationInfo.init(
      infosIndex,
      owners,
      derivations,
      extendedKeys
    );
    account = await wallet.newAccountWithExtendedKeyInfo(newExtendedKeys);
  }

  const eventReceiver = await core.EventReceiver.newInstance();
  const eventBus = await account.synchronize();
  const serialContext = await core
    .getThreadDispatcher()
    .getMainExecutionContext();

  await eventBus.subscribe(serialContext, eventReceiver);
  const ethAccount = await account.asEthereumLikeAccount();
  const erc20accounts = await ethAccount.getERC20Accounts();

  return { erc20count: erc20accounts.length };
}).then(res => console.log(res), err => console.error(err));
