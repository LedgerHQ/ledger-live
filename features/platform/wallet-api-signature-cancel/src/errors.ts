/** A sign request cancelled by its Live App, e.g. when the dApp it was made for disconnected. */
export class SignatureRequestCancelled extends Error {
  override name = "SignatureRequestCancelled";
  constructor() {
    super("The Live App cancelled the sign request");
  }
}
