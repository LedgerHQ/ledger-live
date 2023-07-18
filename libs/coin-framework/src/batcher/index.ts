import { Batch, BatchElement, Batcher } from "./types";

/**
 * Factory to make an API call batcher.
 *
 * It will wait for a complete `tick` to accumulate all the requests
 * before sending it as one call to a given API.
 * Once the response is received, it will then spread the results to each request Promise,
 * just like if each request had been made separately.
 *
 * Inspired by https://github.com/graphql/dataloader
 */
export const makeBatcher = <I, P, R>(
  request: (input: I[], params: P) => Promise<R[]>,
  params: P,
): Batcher<I, R> =>
  (() => {
    const queue: BatchElement<I, R>[] = [];

    let debounce: NodeJS.Timeout;
    const timeoutBatchCall = () => {
      // Clear the previous scheduled call if it was existing
      clearTimeout(debounce);

      // Schedule a new call with the whole batch
      debounce = setTimeout(() => {
        // Seperate each batch element properties into arrays by type and index
        const { elements, resolvers, rejecters } = queue.reduce(
          (acc, { element, resolve, reject }) => {
            acc.elements.push(element);
            acc.resolvers.push(resolve);
            acc.rejecters.push(reject);

            return acc;
          },
          {
            elements: [],
            resolvers: [],
            rejecters: [],
          } as Batch<I, R>,
        );
        // Empty the queue
        queue.length = 0;

        // Make the call with all the couples of contract and tokenId at once
        request(elements, params)
          .then(results => {
            // Resolve each batch element with its own resolver and only its response
            results.forEach((response, index) => resolvers[index](response));
          })
          .catch(err => {
            // Reject all batch element with the error
            rejecters.forEach(reject => reject(err));
          });
      });
    };
    // Load the metadata for a given couple contract + tokenId

    return element => {
      return new Promise((resolve, reject) => {
        queue.push({ element, resolve, reject });
        timeoutBatchCall();
      });
    };
  })();
