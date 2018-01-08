//@flow
import React, { Component } from "react";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { AnimalQuery } from "../tests-utils/mock-1";

test("freezeTransition=true should not render a pending step", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let node;
  let renderCount = 0;

  function check() {
    expect(node).toBeDefined();
    if (!node) return;
    const { animal, animalId, reloading } = node.props;
    expect(reloading).toBe(false);
    if (animal) expect(animal.id).toBe(animalId); // animalId always should be a.id
  }

  const Animal = connectData(
    class Animal extends Component<*> {
      componentWillMount() {
        node = this;
      }
      render() {
        renderCount++;
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
  check();
  expect(renderCount).toBe(1);
  inst.update(render(<Animal animalId="id_doge" />));
  check();
  net.tick();
  await flushPromises();
  check();
  expect(renderCount).toBe(2);
  inst.unmount();
});
