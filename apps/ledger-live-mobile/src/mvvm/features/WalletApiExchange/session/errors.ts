/**
 * The user dismissed the drawer. `executeSwap` recognises it by name and keeps it off screen, so
 * the name must not change.
 */
export class DrawerClosedError extends Error {
  override name = "DrawerClosedError";

  constructor(message = "User closed the drawer") {
    super(message);
  }
}
