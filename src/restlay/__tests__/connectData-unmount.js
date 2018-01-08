//@flow
import React, { Component } from "react";
import renderer from "react-test-renderer";
import invariant from "invariant";
import connectData from "../connectData";
import {
  NullComponent,
  createRender,
  networkFromMock,
  flushPromises
} from "../tests-utils";
import createMock, { AnimalQuery } from "../tests-utils/mock-1";

test("if component terminates earlier it should not trigger errors if there are pending work", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(NullComponent, {
    queries: { animal: AnimalQuery },
    propsToQueryParams: ({ animalId }) => ({ animalId })
  });
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  inst.unmount();
});

test("forceFetch & unmount", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let forceFetch: ?Function;
  const Animal = connectData(
    class Animal extends Component<*> {
      componentWillMount() {
        forceFetch = this.props.restlay.forceFetch;
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
  invariant(forceFetch, "forceFetch was loaded");
  forceFetch();
  inst.unmount();
});

test("fetchQuery & unmount", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let fetchQuery: ?Function;
  const Animal = connectData(
    class Animal extends Component<*> {
      componentWillMount() {
        fetchQuery = this.props.restlay.fetchQuery;
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
  invariant(fetchQuery, "fetchQuery was loaded");
  fetchQuery(new AnimalQuery({ animalId: "id_doge" }));
  inst.unmount();
});
