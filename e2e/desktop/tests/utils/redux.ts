import { Page } from "@playwright/test";
import { INTERVAL, TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

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

/** A staking position of an account of the store, with its amounts in base units. */
export type StoreStakingPosition = {
  positionId?: string;
  validatorAddress: string;
  /** `bonded` or `activating` for a delegation, `deactivating` or `withdrawable` for an unbonding. */
  status?: string;
  amount: string;
  withdrawableAmount?: string;
  canStake?: boolean;
};

type StoreUnit = {
  name: string;
  code: string;
  magnitude: number;
  showAllDigits?: boolean;
  prefixCode?: boolean;
};

/** What the specs read of an account of the store. */
export type StoreAccount = {
  id: string;
  currencyId: string;
  index: number;
  freshAddress: string;
  unit: StoreUnit;
  /** The delegations, then the unbondings, of its staking resources. */
  stakingPositions: StoreStakingPosition[];
};

type StoreAmount = { toFixed: () => string };

type StoreStakingPositionState = Omit<StoreStakingPosition, "amount" | "withdrawableAmount"> & {
  amount: StoreAmount;
  withdrawableAmount?: StoreAmount;
};

type StoreAccountState = {
  id: string;
  index: number;
  freshAddress: string;
  currency: { id: string; units: StoreUnit[] };
  stakingResources?: {
    delegations: StoreStakingPositionState[];
    unbondings: StoreStakingPositionState[];
  };
};

export class Redux {
  constructor(protected readonly page: Page) {}

  public actions: Action[] = [];

  /** `init.tsx` exposes the store late (and only under `PLAYWRIGHT_RUN`), so wait instead of assuming. */
  private readonly waitForStore = () =>
    this.page
      .waitForFunction(() => !!window.__STORE__)
      .catch(cause => {
        throw new Error(
          "window.__STORE__ was never exposed: the renderer did not finish bootstrapping (is PLAYWRIGHT_RUN set?)",
          { cause },
        );
      });

  public readonly dispatch = async (action: Action) => {
    await this.waitForStore();
    await this.page.evaluate(a => window.__STORE__.dispatch(a), action);
  };

  public readonly getAccounts = async (): Promise<StoreAccount[]> => {
    await this.waitForStore();
    return this.page.evaluate(() => {
      const accounts: StoreAccountState[] = window.__STORE__.getState().accounts;
      return accounts.map(({ id, index, freshAddress, currency, stakingResources }) => ({
        id,
        currencyId: currency.id,
        index,
        freshAddress,
        unit: currency.units[0],
        stakingPositions: [
          ...(stakingResources?.delegations ?? []),
          ...(stakingResources?.unbondings ?? []),
        ].map(position => ({
          positionId: position.positionId,
          validatorAddress: position.validatorAddress,
          status: position.status,
          amount: position.amount.toFixed(),
          withdrawableAmount: position.withdrawableAmount?.toFixed(),
          canStake: position.canStake,
        })),
      }));
    });
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

  public async waitForReduxAction(actionType: string, timeout: number = TIMEOUT.medium) {
    return new Promise((resolve, reject) => {
      const checkAction = () => {
        const action = this.actions.find(action => action.type === actionType);
        if (action) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve(action);
        }
      };

      const intervalId = setInterval(checkAction, INTERVAL.instant);
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error(`Timeout waiting for action: ${actionType}`));
      }, timeout);

      checkAction();
    });
  }
}
