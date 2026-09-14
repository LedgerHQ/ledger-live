import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import type { PayCardAuthProps } from "../types";
import { Section } from "../components/Section/Section";
import { maskToken } from "./maskToken";

function SessionStatus({ session, sessionError }: Readonly<PayCardAuthProps>) {
  if (sessionError !== null) {
    return (
      <div className="flex flex-wrap items-center gap-8">
        <Tag size="sm" appearance="error" label="Unreadable" />
        <span className="body-4 text-muted">{sessionError}</span>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex flex-wrap items-center gap-8">
        <Tag size="sm" appearance="success" label="Signed in" />
        <span className="body-4 text-muted">{`access ${maskToken(session.accessToken)}`}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-8">
      <Tag size="sm" appearance="gray" label="No session" />
    </div>
  );
}

export function AuthSection({ auth }: { readonly auth: PayCardAuthProps }) {
  const { busy, lastResult, mockSession, session, signOut } = auth;

  return (
    <Section title="Card session">
      <SessionStatus {...auth} />

      <div className="flex flex-wrap gap-8">
        <Button
          appearance="accent"
          size="sm"
          disabled={busy || !mockSession.available || session !== null}
          onClick={mockSession.signIn}
        >
          Sign in with a mock session
        </Button>
        <Button appearance="gray" size="sm" disabled={busy || session === null} onClick={signOut}>
          Sign out current session
        </Button>
        <Button appearance="gray" size="sm" disabled={busy} onClick={auth.fetchUser}>
          {mockSession.available ? "[MSW] Get user" : "Get user"}
        </Button>
      </div>

      {mockSession.available ? null : (
        <span className="body-4 text-muted">
          Start with `pnpm desktop start:msw` to sign in without the provider.
        </span>
      )}

      {lastResult ? (
        <span className={`body-4 ${lastResult.failed ? "text-error" : "text-muted"}`}>
          {lastResult.message}
        </span>
      ) : null}
    </Section>
  );
}
