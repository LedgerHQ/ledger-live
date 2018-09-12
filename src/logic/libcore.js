// @flow

import getLibCore from "./getLibcore";

async function getOrCreateWallet({
  core,
  walletName,
  currencyId,
}: {
  core: *,
  walletName: string,
  currencyId: string,
}) {
  const poolInstance = core.getPoolInstance();
  const currency = await core.coreWalletPool.getCurrency(
    poolInstance,
    currencyId,
  );
  let wallet;
  try {
    wallet = await core.coreWalletPool.getWallet(poolInstance, walletName);
  } catch (err) {
    const config = await core.coreDynamicObject.newInstance();
    core.coreDynamicObject.putString(config, "KEYCHAIN_ENGINE", "BIP49_P2SH");
    core.coreDynamicObject.putString(
      config,
      "KEYCHAIN_DERIVATION_SCHEME",
      "49'/1'/<account>'/<node>/<address>",
    );
    wallet = await core.coreWalletPool.createWallet(
      poolInstance,
      walletName,
      currency,
      config,
    );
  }
  return wallet;
}

export async function syncAccount({ core, account }: { core: *, account: * }) {
  const eventReceiver = await core.coreEventReceiver.newInstance();
  const eventBus = await core.coreAccount.synchronize(account);
  const serialContext = await core.coreThreadDispatcher.getSerialExecutionContext(
    core.getThreadDispatcher(),
    "main",
  );
  await core.coreEventBus.subscribe(eventBus, serialContext, eventReceiver);
}

export async function getAccountFromXPUB({
  xpub,
  currencyId,
}: {
  xpub: string,
  currencyId: string,
}) {
  let account;
  const index = 0;
  const core = await getLibCore();

  // TODO: real wallet name
  const walletName = `temporary-wallet-name-${Date.now()}`;

  const wallet = await getOrCreateWallet({ core, walletName, currencyId });

  // TODO: why do we do this now?
  await core.flush();

  try {
    account = await core.coreWallet.getAccount(wallet, index);
  } catch (err) {
    const extendedInfos = await core.coreWallet.getExtendedKeyAccountCreationInfo(
      wallet,
      index,
    );
    const infosIndex = await core.coreExtendedKeyAccountCreationInfo.getIndex(
      extendedInfos,
    );
    const extendedKeys = await core.coreExtendedKeyAccountCreationInfo.getExtendedKeys(
      extendedInfos,
    );
    const owners = await core.coreExtendedKeyAccountCreationInfo.getOwners(
      extendedInfos,
    );
    const derivations = await core.coreExtendedKeyAccountCreationInfo.getDerivations(
      extendedInfos,
    );

    extendedKeys.push(xpub);

    const newExtendedKeys = await core.coreExtendedKeyAccountCreationInfo.init(
      infosIndex,
      owners,
      derivations,
      extendedKeys,
    );

    account = await core.coreWallet.newAccountWithExtendedKeyInfo(
      wallet,
      newExtendedKeys,
    );
  }

  await syncAccount({ core, account });

  const query = await core.coreAccount.queryOperations(account);
  const completedQuery = await core.coreOperationQuery.complete(query);
  const operations = await core.coreOperationQuery.execute(completedQuery);

  await core.flush();

  // TODO: build an Account
  return {
    account,
    operations,
  };
}
