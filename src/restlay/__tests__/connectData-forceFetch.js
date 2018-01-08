//@flow
import React from "react";
import invariant from "invariant";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { AnimalsQuery, AnimalQuery } from "../tests-utils/mock-1";

test("forceFetch will trigger a refresh of siblings that depend on same query", async () => {
  const m = createMock();
  const net = networkFromMock(m);
  const render = createRender(net.network);
  let rlay;
  const All = connectData(
    ({ animals, animal }) =>
      animal.name + "_" + animals.reduce((s, a) => s + a.age, 0),
    {
      queries: {
        animals: AnimalsQuery,
        animal: AnimalQuery
      },
      //$FlowFixMe
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const Animal = connectData(
    //$FlowFixMe
    ({ observed, restlay, animal }) => (
      observed ? (rlay = restlay) : null, animal.name + "_" + animal.age
    ),
    {
      queries: {
        animal: AnimalQuery
      },
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const Animals = connectData(({ animals }) => animals.length, {
    queries: {
      animals: AnimalsQuery
    }
  });
  const inst = renderer.create(
    render(
      <div>
        <All animalId="id_doge" />
        <All animalId="id_max" />
        <Animal animalId="id_max" observed />
        <Animal animalId="id_doge" />
        <Animals />
      </div>
    )
  );
  expect(inst.toJSON()).toMatchObject({ children: null });
  expect(net.tick()).toBe(3);
  await flushPromises();
  expect(inst.toJSON()).toMatchObject({
    children: ["doge_19", "max_19", "max_14", "doge_5", "2"]
  });
  m.incrementAge();
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(inst.toJSON()).toMatchObject({
    children: ["doge_19", "max_19", "max_14", "doge_5", "2"]
  });
  invariant(rlay, "restlay available");
  rlay.forceFetch();
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toMatchObject({
    children: ["doge_20", "max_20", "max_15", "doge_5", "2"]
  });
  rlay.forceFetch();
  rlay.forceFetch();
  rlay.forceFetch();
  rlay.forceFetch();
  rlay.forceFetch();
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toMatchObject({
    children: ["doge_20", "max_20", "max_15", "doge_5", "2"]
  });
  inst.unmount();
});

test("forceFetch will reload multiple queries", async () => {
  const m = createMock();
  const net = networkFromMock(m);
  const render = createRender(net.network);
  let rlay;
  const All = connectData(
    ({ animals, animal, restlay }) => (
      (rlay = restlay),
      animal.name + "_" + animals.reduce((s, a) => s + a.age, 0)
    ),
    {
      queries: {
        animals: AnimalsQuery,
        animal: AnimalQuery
      },
      //$FlowFixMe
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const inst = renderer.create(render(<All animalId="id_doge" />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(2);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_19");
  m.incrementAge();
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_19");
  invariant(rlay, "restlay available");
  const promise = rlay.forceFetch();
  expect(promise).toBeInstanceOf(Promise);
  let completed = false;
  promise.then(() => {
    completed = true;
  });
  await flushPromises();
  expect(completed).toBe(false);
  expect(net.tickOne()).toBe(1);
  await flushPromises();
  expect(completed).toBe(false);
  expect(net.tickOne()).toBe(1);
  await flushPromises();
  expect(completed).toBe(true);
  expect(inst.toJSON()).toBe("doge_21");
  inst.unmount();
});

test("forceFetch reload queries even if it have a cacheMaxAge", async () => {
  const m = createMock();
  const net = networkFromMock(m);
  const render = createRender(net.network);
  let rlay;
  const All = connectData(
    ({ restlay, animal }) => ((rlay = restlay), animal.age),
    {
      queries: {
        animal: AnimalQuery
      },
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const inst = renderer.create(render(<All animalId="id_max" />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("14");
  m.incrementAge();
  invariant(rlay, "restlay available");
  rlay.forceFetch();
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("15");
  inst.unmount();
});
