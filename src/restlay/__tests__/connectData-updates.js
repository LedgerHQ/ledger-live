//@flow
import React, { Component } from "react";
import invariant from "invariant";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { AnimalsQuery, AnimalQuery } from "../tests-utils/mock-1";

test("multiple update with same props trigger no re-rendering", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let update = 0;

  const Animal = connectData(
    class Animal extends Component<*> {
      componentWillUpdate() {
        ++update;
      }
      render() {
        return null;
      }
    },
    {
      queries: { animal: AnimalQuery },
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  expect(update).toBe(0);
  inst.update(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  inst.update(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  inst.update(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  expect(update).toBe(0);
  inst.unmount();
});

test("multiple queries trigger only one React update", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let renderCount = 0;
  const All = connectData(
    ({ animals, animal }) => (
      ++renderCount, animal.name + "_" + animals.length
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
  expect(net.tickOne()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe(null);
  expect(net.tickOne()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_2");
  expect(renderCount).toBe(1);
  inst.unmount();
});

test("triggering new queries don't redraw if data doesn't change", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let update = 0;
  let forceFetch: ?Function;

  const Animal = connectData(
    class Animal extends Component<*> {
      componentWillMount() {
        forceFetch = this.props.restlay.forceFetch;
      }
      componentWillUpdate() {
        ++update;
      }
      render() {
        return null;
      }
    },
    {
      queries: { animal: AnimalQuery },
      propsToQueryParams: ({ animalId }) => ({ animalId }),
      freezeTransition: true
    }
  );
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  expect(forceFetch).toBeDefined();
  invariant(forceFetch, "forceFetch should be defined");
  expect(update).toBe(0);
  forceFetch();
  net.tick();
  await flushPromises();
  forceFetch();
  net.tick();
  await flushPromises();
  forceFetch();
  net.tick();
  await flushPromises();
  forceFetch();
  net.tick();
  await flushPromises();
  expect(update).toBe(0);
  inst.unmount();
});
