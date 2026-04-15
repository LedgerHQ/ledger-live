import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@ledgerhq/lumen-ui-react";
import PageHeader from "LLD/components/PageHeader";
import useBaanxSandboxViewModel from "./useBaanxSandboxViewModel";
import type { BaanxSandboxViewModel } from "./types";

export default function BaanxSandbox() {
  const viewModel = useBaanxSandboxViewModel();
  return <BaanxSandboxView viewModel={viewModel} />;
}

function BaanxSandboxView({ viewModel }: { readonly viewModel: BaanxSandboxViewModel }) {
  const { state, email, password, setEmail, setPassword, login, logout, navigateBack } = viewModel;
  const { t } = useTranslation();

  const isLoading = state.kind === "in-progress";

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title={t("baanxSandbox.title")} onBack={navigateBack} />

      {state.kind !== "authenticated" && (
        <div className="rounded-md bg-surface p-6">
          <h2 className="heading-5 mb-4">{t("baanxSandbox.loginHeading")}</h2>

          <form
            className="flex flex-col gap-4"
            onSubmit={e => {
              e.preventDefault();
              login();
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="body-3 text-on-surface-secondary">
                {t("baanxSandbox.emailLabel")}
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                className="rounded-sm border border-outline bg-surface-secondary px-3 py-2 body-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="body-3 text-on-surface-secondary">
                {t("baanxSandbox.passwordLabel")}
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="rounded-sm border border-outline bg-surface-secondary px-3 py-2 body-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </label>

            <Button type="submit" appearance="accent" disabled={isLoading || !email || !password}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size={16} />
                  {t(`baanxSandbox.steps.${state.step}`)}
                </span>
              ) : (
                t("baanxSandbox.loginButton")
              )}
            </Button>
          </form>

          {state.kind === "error" && (
            <div className="mt-4 rounded-sm bg-error/10 p-3 body-3 text-error">{state.message}</div>
          )}
        </div>
      )}

      {state.kind === "authenticated" && (
        <div className="rounded-md bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-5">{t("baanxSandbox.profileHeading")}</h2>
            <Button appearance="gray" size="sm" onClick={logout}>
              {t("baanxSandbox.logoutButton")}
            </Button>
          </div>
          <pre className="overflow-auto rounded-sm bg-surface-secondary p-4 body-3 text-on-surface max-h-[60vh]">
            {JSON.stringify(state.profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
