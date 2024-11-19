import { createWalletSyncWatchLoop } from "./createWalletSyncWatchLoop";
import { advanceTimersByTimeAsync, getWalletSyncWatchLoopConfig } from "./__mocks__/watchLoop";
import { Subject } from "rxjs";
import { TrustchainEjected, TrustchainOutdated } from "@ledgerhq/ledger-key-ring-protocol/errors";

jest.useFakeTimers();

describe("createWalletSyncWatchLoop", () => {
  it("should pull but not push when there is no changes", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(10);

    watchLoop.unsubscribe();

    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(1);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.push).toHaveBeenCalledTimes(0);
  });

  it("should pull and push when there are changes", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig.latestDistantStateSelector = jest
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValue(1);
    walletSyncWatchLoopConfig.localStateSelector = jest.fn().mockReturnValue(1);

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(20);

    watchLoop.unsubscribe();

    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledWith(
      walletSyncWatchLoopConfig.trustchain,
      walletSyncWatchLoopConfig.memberCredentials,
    );
    expect(walletSyncWatchLoopConfig.walletSyncSdk.push).toHaveBeenCalledTimes(1);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.push).toHaveBeenCalledWith(
      walletSyncWatchLoopConfig.trustchain,
      walletSyncWatchLoopConfig.memberCredentials,
      1,
    );
  });

  it("notifications triggers the watch loop", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    const notifications = new Subject<number>();

    walletSyncWatchLoopConfig.walletSyncSdk.listenNotifications = (t, m) => {
      expect(t).toEqual(walletSyncWatchLoopConfig.trustchain);
      expect(m).toEqual(walletSyncWatchLoopConfig.memberCredentials);
      return notifications;
    };

    walletSyncWatchLoopConfig.watchConfig = {
      notificationsEnabled: true,
      initialTimeout: 5000,
      pollingInterval: 10000,
    };

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(15);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    notifications.next(2);

    await advanceTimersByTimeAsync(1);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(3);

    watchLoop.unsubscribe();
  });

  it("notifications disabled does not triggers the watch loop", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    const notifications = new Subject<number>();

    walletSyncWatchLoopConfig.walletSyncSdk.listenNotifications = () => notifications;

    walletSyncWatchLoopConfig.watchConfig = {
      notificationsEnabled: false,
      initialTimeout: 5000,
      pollingInterval: 10000,
    };

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(15);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    notifications.next(2);

    await advanceTimersByTimeAsync(1);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    watchLoop.unsubscribe();
  });

  it("should execute the loop on user refresh intent", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig.watchConfig = {
      initialTimeout: 5000,
      pollingInterval: 10000,
      userIntentDebounce: 1000,
    };

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(15);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    await advanceTimersByTimeAsync(1);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    watchLoop.onUserRefreshIntent();
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    await advanceTimersByTimeAsync(1);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(3);

    watchLoop.unsubscribe();
  });

  it("should stop running the loop when unsubscribed", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(15);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);

    watchLoop.unsubscribe();

    await advanceTimersByTimeAsync(30);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(2);
  });
  it("should wait for the initial timeout before running the loop", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig.watchConfig = {
      initialTimeout: 5000,
    };

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(3);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(0);

    await advanceTimersByTimeAsync(2);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(1);

    watchLoop.unsubscribe();
  });
  it("should call the onError function on error", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig.onStartPolling = () => {
      throw new Error("error");
    };
    walletSyncWatchLoopConfig.onError = jest.fn();

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(5);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(0);
    expect(walletSyncWatchLoopConfig.onError).toHaveBeenCalledTimes(1);
    expect(walletSyncWatchLoopConfig.onError).toHaveBeenCalledWith(new Error("error"));
    expect(walletSyncWatchLoopConfig.onTrustchainRefreshNeeded).toHaveBeenCalledTimes(0);

    watchLoop.unsubscribe();
  });
  it("should log the error if no onError function is given", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig.onStartPolling = () => {
      throw new Error("error");
    };

    jest.spyOn(console, "error");

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(5);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(0);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(new Error("error"));

    watchLoop.unsubscribe();
  });
  it("should refresh the trustchain in case of a TrustchainEjectedError or a TrustchainOutdated", async () => {
    const walletSyncWatchLoopConfig = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig.onStartPolling = () => {
      throw new TrustchainEjected("error");
    };

    const watchLoop = createWalletSyncWatchLoop(walletSyncWatchLoopConfig);

    await advanceTimersByTimeAsync(5);
    expect(walletSyncWatchLoopConfig.walletSyncSdk.pull).toHaveBeenCalledTimes(0);
    expect(walletSyncWatchLoopConfig.onTrustchainRefreshNeeded).toHaveBeenCalledTimes(1);

    watchLoop.unsubscribe();

    const walletSyncWatchLoopConfig2 = getWalletSyncWatchLoopConfig();

    walletSyncWatchLoopConfig2.onStartPolling = () => {
      throw new TrustchainOutdated("error");
    };

    const watchLoop2 = createWalletSyncWatchLoop(walletSyncWatchLoopConfig2);

    await advanceTimersByTimeAsync(5);
    expect(walletSyncWatchLoopConfig2.walletSyncSdk.pull).toHaveBeenCalledTimes(0);
    expect(walletSyncWatchLoopConfig2.onTrustchainRefreshNeeded).toHaveBeenCalledTimes(1);

    watchLoop2.unsubscribe();
  });
});
