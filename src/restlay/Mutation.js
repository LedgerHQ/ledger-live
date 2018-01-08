//@flow
import type { Store } from "./dataStore";

// A mutation maps to another verb on the API and means a modification of the data.
// it will allow us to define mutation response etc..
export default class Mutation<Input, Response> {
  props: Input;

  // define the URI to hit for the API. can also pass a template function
  uri: string;
  // HTTP verb
  method: string;
  // the schema of the expected HTTP response. defined using normalizr-style schema.
  responseSchema: Object | Array<Object>;

  constructor(props: Input) {
    this.props = props;
  }

  /*
   * Allow a mutation to define a body to send to server
   */
  getBody(): ?(Object | Array<Object>) {
    return null;
  }

  getResponseSchema() {
    return this.responseSchema;
  }

  /*
   * Allow a mutation to define the optimistic behavior
   */
  +optimisticUpdater: (_store: Store) => Store;
  // TODO implement optimistic updates.
  // aka being able to define how API calls should alter the local store
  // to update the UI before the call was successful.
  // challenges are:
  // - to express many possible usecases. e.g. a delete remove from one or more collections. a creation can also add in collections, and or can alter connected objects.
  // - to have rollback on error.
  // - to provide a way that a given data is optimistic so we can vary the rendering based on that.
}
