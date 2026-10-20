import React, { Component, Suspense, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useLLDCoinFamily } from "~/renderer/families";
import logger from "~/renderer/logger";

// A family that fails to load only loses its effect, never the app.
class FamilyAppEffectBoundary extends Component<
  { family: string; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    logger.error(`app effect of family ${this.props.family} failed`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function FamilyAppEffect({ family }: { family: string }) {
  const { AppEffect } = useLLDCoinFamily(family);
  return AppEffect ? <AppEffect /> : null;
}

/** Mounts the app-wide effect of every coin family the user holds an account of. */
export function FamilyAppEffects() {
  const accounts = useSelector(accountsSelector);
  const families = useMemo(
    () => [...new Set(accounts.map(account => account.currency.family))].sort(),
    [accounts],
  );

  return (
    <>
      {families.map(family => (
        <FamilyAppEffectBoundary key={family} family={family}>
          <Suspense fallback={null}>
            <FamilyAppEffect family={family} />
          </Suspense>
        </FamilyAppEffectBoundary>
      ))}
    </>
  );
}
