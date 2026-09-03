import type { DevToolsConfig } from "@devtools/registry";

type PayCardToolProps = Extract<DevToolsConfig[number], { id: "pay-card" }>["config"];
type PayCardAuthProps = NonNullable<PayCardToolProps["auth"]>;

export type UsePayCardAuthPropsOptions = {
  readonly openPayTab?: () => void;
};

const noop = () => {};

export function usePayCardAuthProps(options: UsePayCardAuthPropsOptions = {}): PayCardAuthProps {
  return {
    session: null,
    sessionError: null,
    busy: false,
    lastResult: null,
    readTokens: noop,
    renewNow: noop,
    breakAccessToken: noop,
    breakRefreshToken: noop,
    clearSession: noop,
    fetchUser: noop,
    openPayTab: options.openPayTab,
    mock: {
      available: false,
      response: "pass",
      responses: [],
      setResponse: noop,
      renewals: 0,
      resetRenewals: noop,
      armUnauthorized: noop,
    },
  };
}
