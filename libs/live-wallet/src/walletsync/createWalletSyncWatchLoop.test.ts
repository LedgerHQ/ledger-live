import { createWalletSyncWatchLoop } from "./createWalletSyncWatchLoop";
import { advanceTimersByTimeAsync, getWalletSyncWatchLoopConfig } from "./__mocks__/watchLoop";
import { Subject } from "rxjs";

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
});
