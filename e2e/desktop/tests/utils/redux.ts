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

  public listenToReduxActions = async () => {
    await this.page.exposeFunction("recordAction", (action: Action) => {
      this.actions.push(action);
    });

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

  public async waitForReduxAction(actionType: string, timeout: number = 5000) {
    this.actions = [];
    return new Promise((resolve, reject) => {
      const checkAction = () => {
        const action = this.actions.find(action => action.type === actionType);
        if (action) {
          resolve(action);
        } else {
          setTimeout(checkAction, 100);
        }
      };
      setTimeout(() => reject(new Error(`Timeout waiting for action: ${actionType}`)), timeout);
      checkAction();
    });
  }
}
