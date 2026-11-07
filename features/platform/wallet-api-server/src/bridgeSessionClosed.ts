/** The live app's main frame moved to another origin: the requests of the previous one are dropped. */
export class BridgeSessionClosed extends Error {
  override name = "BridgeSessionClosed";
  constructor() {
    super("The Live App main frame changed origin: the request was cancelled");
  }
}
