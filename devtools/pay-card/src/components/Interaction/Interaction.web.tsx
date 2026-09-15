import { Button, Spinner } from "@ledgerhq/lumen-ui-react";
import type {
  PayCardDetailsCssProps,
  PayCardDetailsImageProps,
  PayCardInteractionProps,
} from "../../types";

export interface InteractionProps extends PayCardInteractionProps {
  readonly onBack: () => void;
}

/**
 * The provider bakes these into the image, so they are chosen per colour scheme and a fresh token is
 * needed to change them. The PAN strip sits a shade off the card body — pure black or white against
 * the card's own near-black or near-white — so the card number reads as its own surface.
 */
const detailsCss = (isDark: boolean): PayCardDetailsCssProps => ({
  cardBackgroundColor: isDark ? "#1f1f1f" : "#f1f1f1",
  cardTextColor: isDark ? "#ffffff" : "#000000",
  panBackgroundColor: isDark ? "#000000" : "#ffffff",
  panTextColor: isDark ? "#ffffff" : "#000000",
});

/** The window is the only colour-scheme signal here; the app reads it the same way. */
function prefersDark(): boolean {
  // Optional throughout: a host that stubs `matchMedia` may answer with nothing, and a scheme
  // nobody reports is the light one.
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

/**
 * Stands in for the card details until a developer asks for them, then shows the image the provider
 * rendered. The URL is the credential, so it loads with no headers and is never shown as text.
 *
 * The provider spends the token on first use, so the image cannot be fetched twice; unlike the
 * native screen there is no per-image cache mode to ask for here, and rewriting the URL to dodge the
 * cache would change the credential.
 */
function CardDetails({ imageUrl, isFetching, error, request }: PayCardDetailsImageProps) {
  if (imageUrl !== undefined) {
    return <img src={imageUrl} alt="Card details" className="w-full object-contain aspect-video" />;
  }

  return (
    <button
      type="button"
      onClick={() => request(detailsCss(prefersDark()))}
      disabled={isFetching}
      className="flex flex-col items-center justify-center gap-8 w-full aspect-video rounded-lg border border-muted-subtle"
    >
      {isFetching ? <Spinner /> : null}
      <span className="body-2 text-muted">
        {isFetching ? "Requesting…" : "Request Card Details"}
      </span>
      {error === undefined ? null : <span className="body-3 text-error">{error}</span>}
    </button>
  );
}

export function Interaction({ probes, details, onBack }: InteractionProps) {
  return (
    <div className="flex flex-col gap-12 p-16 overflow-y-auto">
      <div className="flex flex-wrap gap-8">
        <Button
          appearance="gray"
          size="sm"
          onClick={() => {
            // Drop the minted URL: it is single-use, so coming back must mint a fresh one.
            details.clear();
            onBack();
          }}
        >
          Back
        </Button>
      </div>

      <CardDetails {...details} />

      {probes.map(probe => (
        <div key={probe.id} className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-8">
            <Button appearance="accent" size="sm" loading={probe.isFetching} onClick={probe.run}>
              {probe.label}
            </Button>
          </div>
          {probe.error === undefined ? null : (
            <p className="body-3 text-error break-all">{probe.error}</p>
          )}
          {probe.result === undefined ? null : (
            <pre className="body-3 text-muted whitespace-pre-wrap break-all">{probe.result}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
