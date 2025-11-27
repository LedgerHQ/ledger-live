# MSW Mocks - Testing Guide

## Simulating 500 Errors

To test 500 error handling in the application (especially in asset selection):

### Method 1: Via Developer Settings Interface (Recommended)

1. Launch the application in development mode with MSW enabled:
   ```bash
   pnpm desktop start:msw
   ```

2. Go to **Settings > Developer**

3. Enable the toggle **"Simulate 500 Error (DADA API)"**

4. Try to add an account or access asset selection

5. You should see a generic error page instead of the raw 500 error details

6. Disable the toggle to return to normal behavior

### Method 2: Via Browser Console

1. Launch the application in development mode with MSW enabled

2. Open the browser console (DevTools)

3. Execute:
   ```javascript
   // Enable 500 error simulation
   window.__LEDGER_LIVE__.toggleSimulate500Error(true);
   
   // Disable simulation
   window.__LEDGER_LIVE__.toggleSimulate500Error(false);
   ```

### Method 3: Modify Code Directly

In `src/mocks/browser.ts`, change the value of `simulate500Error`:

```typescript
let simulate500Error = true; // Set to true to simulate the error
```

## What is Being Tested

When the 500 error is simulated:
- The DADA API returns a Cloudflare HTML error page (as in production)
- The `GenericError` component should display instead of the raw HTML
- The user should see a user-friendly error message with a "Retry" button
- No technical details (HTML, stack trace, etc.) should be visible

## Simulated Error Structure

The simulated 500 error returns:
- **Status**: 500
- **Content-Type**: text/html
- **Body**: Cloudflare HTML page with `<a>`, `<span>` tags, etc.

This reproduces exactly what happens in production when the DADA API is down or returns a 500 error.

