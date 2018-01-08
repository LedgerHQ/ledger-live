//@flow
import fetchWithRetries from "./fetchWithRetries";

export function NetworkError(obj: *) {
  this.name = "NetworkError";
  Object.assign(this, obj);
}
NetworkError.prototype = Object.create(Error.prototype);

export default function<T>(
  uri: string,
  method: string,
  body: ?(Object | Array<Object>)
): Promise<T> {
  const headers = {
    // FIXME we'll need to figure out this. how can custom headers be provided implicitely & at runtime from user land?
    // (we might move the network stack in each impl)
    // "X-Ledger-Auth": getLocalStorageToken(),
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const options: Object = { headers, method };
  if (method !== "GET" && body) {
    options.body = JSON.stringify(body);
  }
  return fetchWithRetries(uri, options).then(response => {
    if (response.status < 200 || response.status >= 300) {
      const baseErrorObject = {
        message: "network error",
        status: response.status
      };
      return response
        .json()
        .then(
          json => new NetworkError({ ...baseErrorObject, json }),
          () => new NetworkError(baseErrorObject)
        )
        .then(e => Promise.reject(e));
    }
    return response.json();
  });
}
