import type { PayCardDetailsToken } from "./types";

/**
 * The response schema only accepts an absolute `https:` URL, and the app loads it straight into an
 * image. The MSW handler that answers this URL keeps the request inside the app, so the mock card
 * never reaches the provider's image host.
 */
export const MOCK_CARD_DETAILS_IMAGE_URL = "https://card-mock.ledger.com/card-details-image.svg";

export function mockPayCardDetailsToken(): PayCardDetailsToken {
  return {
    token: "tk_mock_card_details",
    imageUrl: MOCK_CARD_DETAILS_IMAGE_URL,
  };
}

export function mockCardDetailsImage(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="343" height="193" viewBox="0 0 343 193">
  <rect width="343" height="193" rx="12" fill="#1d1d1f" />
  <text x="24" y="38" fill="#8a8a8e" font-family="monospace" font-size="11" letter-spacing="1">MOCK CARD</text>
  <text x="24" y="104" fill="#ffffff" font-family="monospace" font-size="21" letter-spacing="2">4242 4242 4242 4242</text>
  <text x="24" y="146" fill="#8a8a8e" font-family="monospace" font-size="13">EXP 01/30</text>
  <text x="140" y="146" fill="#8a8a8e" font-family="monospace" font-size="13">CVV 123</text>
  <text x="24" y="172" fill="#8a8a8e" font-family="monospace" font-size="13">MOCK HOLDER</text>
</svg>`;
}
