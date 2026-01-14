// To be imported with `require` for an early patch
Promise.allSettled =
  Promise.allSettled ||
  ((promises: Promise<unknown>[]) =>
    Promise.all(
      promises.map(p =>
        p
          .then(value => ({
            status: "fulfilled",
            value,
          }))
          .catch(reason => ({
            status: "rejected",
            reason,
          })),
      ),
    ));
