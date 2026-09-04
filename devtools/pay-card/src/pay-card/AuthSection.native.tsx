import { Box, Button, Text, Tag } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardAuthProps } from "../types";
import { Section } from "../components/Section/Section";

const ROW = { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" } as const;
const FIELD = { flexDirection: "row", gap: 4, alignItems: "center" } as const;

const VISIBLE_TOKEN_CHARS = 9;

function mask(token: string): string {
  const visibleLength = Math.min(VISIBLE_TOKEN_CHARS, Math.max(0, token.length - 1));
  return `${token.slice(0, visibleLength)}…`;
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box style={FIELD}>
      <Text typography="body4" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body4" lx={{ color: "base" }}>
        {value}
      </Text>
    </Box>
  );
}

function SessionStatusRow({
  session,
  sessionError,
}: {
  readonly session: PayCardAuthProps["session"];
  readonly sessionError: PayCardAuthProps["sessionError"];
}) {
  if (sessionError !== null) {
    return (
      <Box style={ROW}>
        <Tag size="sm" appearance="error" label="Unreadable" />
        <Text typography="body4" lx={{ color: "muted" }}>
          {sessionError}
        </Text>
      </Box>
    );
  }

  if (session) {
    return (
      <Box style={ROW}>
        <Tag size="sm" appearance="success" label="Live" />
        <Field label="access" value={mask(session.accessToken)} />
        <Field label="refresh" value={mask(session.refreshToken)} />
      </Box>
    );
  }

  return (
    <Box style={ROW}>
      <Tag size="sm" appearance="gray" label="No session" />
      <Text typography="body4" lx={{ color: "muted" }}>
        Sign in to the Pay tab first.
      </Text>
    </Box>
  );
}

export function AuthSection({ auth }: { readonly auth: PayCardAuthProps }) {
  const { session, sessionError, mock, busy } = auth;

  const requestLabel = (label: string) => (mock.available ? `[MSW] ${label}` : label);

  const chosen = mock.responses.find(response => response.id === mock.response);

  return (
    <>
      <Section title="Auth session">
        <SessionStatusRow session={session} sessionError={sessionError} />

        {!session && sessionError === null && auth.openPayTab ? (
          <Box style={ROW}>
            <Button appearance="accent" size="sm" onPress={auth.openPayTab}>
              Go to the Pay tab
            </Button>
          </Box>
        ) : null}
      </Section>

      <Section title="Device secure storage">
        <Box style={ROW}>
          <Button appearance="gray" size="sm" disabled={busy} onPress={auth.readTokens}>
            Get auth tokens
          </Button>
          <Button appearance="gray" size="sm" disabled={busy} onPress={auth.breakAccessToken}>
            Break access token
          </Button>
          <Button appearance="gray" size="sm" disabled={busy} onPress={auth.breakRefreshToken}>
            Break refresh token
          </Button>
          <Button appearance="red" size="sm" disabled={busy} onPress={auth.clearSession}>
            Clear session
          </Button>
        </Box>
        <Text typography="body4" lx={{ color: "muted" }}>
          Reads and writes the keychain only. A renewal starts when the provider answers 401, so
          break the access token to cause one.
        </Text>
      </Section>

      <Section title="Send API requests">
        <Box style={ROW}>
          <Button appearance="gray" size="sm" disabled={busy} onPress={auth.renewNow}>
            {requestLabel("Renew now")}
          </Button>
          <Button appearance="gray" size="sm" disabled={busy} onPress={auth.fetchUser}>
            {requestLabel("Get user")}
          </Button>
        </Box>
      </Section>

      <Section title="MSW Auth Renewal Mock">
        <Box style={ROW}>
          <Tag
            size="sm"
            appearance={mock.available ? "success" : "gray"}
            label={mock.available ? "MSW running" : "MSW off"}
          />
          <Text typography="body4" lx={{ color: "base" }}>
            {`renewals ${mock.renewals}`}
          </Text>
        </Box>

        {mock.available ? (
          <>
            <Text typography="body4" lx={{ color: "muted" }}>
              What POST /v1/auth/oauth2/token answers:
            </Text>
            <Box style={ROW}>
              {mock.responses.map(response => (
                <Button
                  key={response.id}
                  appearance={response.id === mock.response ? "accent" : "gray"}
                  size="sm"
                  onPress={() => mock.setResponse(response.id)}
                >
                  {response.label}
                </Button>
              ))}
            </Box>
            {chosen ? (
              <Text typography="body4" lx={{ color: "muted" }}>
                {chosen.hint}
              </Text>
            ) : null}
          </>
        ) : (
          <Text typography="body4" lx={{ color: "muted" }}>
            Start with `pnpm mobile start:msw` to choose what the provider answers.
          </Text>
        )}

        <Box style={ROW}>
          <Button
            appearance="gray"
            size="sm"
            disabled={!mock.available}
            onPress={mock.resetRenewals}
          >
            Reset renewals
          </Button>
          <Button
            appearance="gray"
            size="sm"
            disabled={!mock.available}
            onPress={mock.armUnauthorized}
          >
            Next user call → 401
          </Button>
        </Box>
      </Section>
    </>
  );
}
