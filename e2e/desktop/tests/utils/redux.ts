import { Page } from "@playwright/test";

declare global {
  interface Window {
    recordAction?: (action: any) => void;
    __STORE__?: any;
  }
}

export type Action = {
  type: string;
  payload: any;
};

export class Redux {
  constructor(protected page: Page) {}

  public actions: Action[] = [];

  /** `init.tsx` exposes the store late (and only under `PLAYWRIGHT_RUN`), so wait instead of assuming. */
  private waitForStore = () =>
    this.page
      .waitForFunction(() => !!window.__STORE__)
      .catch(() => {
        throw new Error(
          "window.__STORE__ was never exposed: the renderer did not finish bootstrapping (is PLAYWRIGHT_RUN set?)",
        );
      });

  public dispatch = async (action: Action) => {
    await this.waitForStore();
    await this.page.evaluate(a => window.__STORE__.dispatch(a), action);
  };

  public listenToReduxActions = async () => {
    await this.page.exposeFunction("recordAction", (action: Action) => {
      this.actions.push(action);
    });

    await this.waitForStore();
    await this.page.evaluate(() => {
      const store = window.__STORE__;
      store.subscribe(() => {
        const lastAction = store.getState().lastAction;
        if (lastAction && window.recordAction) {
          window.recordAction(lastAction);
        }
      });
    });
  };

  public async waitForReduxAction(actionType: string, timeout: number = 10000) {
    return new Promise((resolve, reject) => {
      const checkAction = () => {
        const action = this.actions.find(action => action.type === actionType);
        if (action) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve(action);
        }
      };

      const intervalId = setInterval(checkAction, 100);
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error(`Timeout waiting for action: ${actionType}`));
      }, timeout);

      checkAction();
    });
  }
}
