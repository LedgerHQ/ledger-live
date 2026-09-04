import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { cardSession, readCardSession, refreshCardSession } from "@features/platform-card";
import { cardApi } from "@shared/api-services";
import type { DevToolsConfig } from "@devtools/registry";

type PayCardToolProps = Extract<DevToolsConfig[number], { id: "pay-card" }>["config"];
type PayCardAuthProps = NonNullable<PayCardToolProps["auth"]>;
type SessionSnapshot = NonNullable<PayCardAuthProps["session"]>;
type ActionResult = NonNullable<PayCardAuthProps["lastResult"]>;

type CardMockState = {
  tokenResponse: string;
  readonly responses: readonly { id: string; label: string; hint: string }[];
  userUnauthorizedOnce: boolean;
  refreshCount: number;
};

function readMockState(): CardMockState | undefined {
  return (globalThis as { payCardMockState?: CardMockState }).payCardMockState;
}

type MockSnapshot = {
  readonly available: boolean;
  readonly response: string;
  readonly responses: readonly { id: string; label: string; hint: string }[];
  readonly renewals: number;
};

function readMockSnapshot(): MockSnapshot {
  const state = readMockState();
  return {
    available: state !== undefined,
    response: state?.tokenResponse ?? "pass",
    responses: state?.responses ?? [],
    renewals: state?.refreshCount ?? 0,
  };
}

type CardQuery = {
  initiate: (
    arg: undefined,
    options: { forceRefetch: boolean; subscribe: boolean },
  ) => (dispatch: unknown) => Promise<unknown>;
};
type CardEndpoints = { endpoints: { getUser?: CardQuery; getCardStatus?: CardQuery } };

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const cardEndpoints = cardApi as unknown as CardEndpoints;

const VISIBLE_TOKEN_CHARS = 9;

function mask(token: string | null): string {
  if (!token) return "null";
  const visibleLength = Math.min(VISIBLE_TOKEN_CHARS, Math.max(0, token.length - 1));
  return `${token.slice(0, visibleLength)}…`;
}

export type UsePayCardAuthPropsOptions = {
  readonly openPayTab?: () => void;
};

export function usePayCardAuthProps(options: UsePayCardAuthPropsOptions = {}): PayCardAuthProps {
  const dispatch = useDispatch();
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [mockSnapshot, setMockSnapshot] = useState(readMockSnapshot);
  const mounted = useRef(true);
  const resultId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const readSession = useCallback(async () => {
    try {
      const current = await cardSession.get();
      if (mounted.current) {
        setSession(current);
        setSessionError(null);
      }
      return current;
    } catch (error) {
      if (mounted.current) {
        setSession(null);
        setSessionError(error instanceof Error ? error.message : String(error));
      }
      return null;
    }
  }, []);

  const nextResultId = useCallback(() => {
    resultId.current += 1;
    return resultId.current;
  }, []);

  const run = useCallback(
    (label: string, action: () => Promise<string>) => {
      setBusy(true);
      void (async () => {
        let outcome: Omit<ActionResult, "id">;
        try {
          outcome = { message: `${label} → ${await action()}`, failed: false };
        } catch (error) {
          outcome = {
            message: `${label} failed: ${error instanceof Error ? error.message : String(error)}`,
            failed: true,
          };
        }

        await readSession();
        if (!mounted.current) return;
        setLastResult({ id: nextResultId(), ...outcome });
        setMockSnapshot(readMockSnapshot());
        setBusy(false);
      })();
    },
    [nextResultId, readSession],
  );

  useEffect(() => {
    void readSession();
  }, [readSession]);

  const readTokens = useCallback(() => {
    run("get auth tokens", async () => "read from the keychain");
  }, [run]);

  const renewNow = useCallback(() => {
    run("renew", async () => {
      const { sessionId, token } = await readCardSession();
      if (!token) return "no session";
      const result = await refreshCardSession(sessionId, token);
      if (result.kind === "refreshed") return `refreshed ${mask(result.accessToken)}`;
      return result.kind;
    });
  }, [run]);

  const breakAccessToken = useCallback(() => {
    run("break access token", async () => {
      const current = await cardSession.get();
      if (!current) return "no session";
      const first = current.accessToken.slice(0, 1);
      await cardSession.set({
        accessToken: (first === "X" ? "Y" : "X") + current.accessToken.slice(1),
        refreshToken: current.refreshToken,
      });
      return "the next request must answer 401 and renew";
    });
  }, [run]);

  const breakRefreshToken = useCallback(() => {
    run("break refresh token", async () => {
      const current = await cardSession.get();
      if (!current) return "no session";
      const first = current.refreshToken.slice(0, 1);
      await cardSession.set({
        accessToken: current.accessToken,
        refreshToken: (first === "X" ? "Y" : "X") + current.refreshToken.slice(1),
      });
      return "the next renewal must end the session";
    });
  }, [run]);

  const clearSession = useCallback(() => {
    run("clear", async () => {
      await cardSession.clear();
      return "cleared";
    });
  }, [run]);

  const fetchUser = useCallback(() => {
    run("get user", async () => {
      const getUser = cardEndpoints.endpoints.getUser;
      if (!getUser) return "unavailable (endpoint not registered)";

      const result = (await dispatch(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        getUser.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }) as never,
      )) as { error?: unknown };
      return result?.error ? "failed" : "ok";
    });
  }, [dispatch, run]);

  const setResponse = useCallback((id: string) => {
    const state = readMockState();
    if (state) state.tokenResponse = id;
    setMockSnapshot(readMockSnapshot());
  }, []);

  const resetRenewals = useCallback(() => {
    const state = readMockState();
    if (state) state.refreshCount = 0;
    setMockSnapshot(readMockSnapshot());
  }, []);

  const armUnauthorized = useCallback(() => {
    const state = readMockState();
    if (state) state.userUnauthorizedOnce = true;
    setLastResult({
      id: nextResultId(),
      message: "the next user call answers 401",
      failed: false,
    });
  }, [nextResultId]);

  return {
    session,
    sessionError,
    busy,
    lastResult,
    readTokens,
    renewNow,
    breakAccessToken,
    breakRefreshToken,
    clearSession,
    fetchUser,
    openPayTab: options.openPayTab,
    mock: {
      available: mockSnapshot.available,
      response: mockSnapshot.response,
      responses: mockSnapshot.responses,
      setResponse,
      renewals: mockSnapshot.renewals,
      resetRenewals,
      armUnauthorized,
    },
  };
}
