//@flow
import URL from "url";
import findIndex from "lodash/findIndex";
import Query from "../Query";
import ConnectionQuery from "../ConnectionQuery";
import Mutation from "../Mutation";
import { create } from "../../restlay/SchemaDef";

// TODO add a more complex schema (2-3 models, interconnected)
// TODO some queries are cached, etc.. need to cover all possible features here

type Animal = {
  id: string,
  name: string,
  age: number
};
const schemaAnimal = create("animals");

export class WorldQuery extends ConnectionQuery<void, Animal[]> {
  uri = "/world";
  nodeSchema = schemaAnimal;
}

export class AnimalsQuery extends Query<void, Animal[]> {
  uri = "/animals";
  responseSchema = [schemaAnimal];
}

export class AnimalQuery extends Query<{ animalId: string }, Animal> {
  uri = "/animals/" + this.props.animalId;
  responseSchema = schemaAnimal;
  cacheMaxAge = 2;
}

export class IncrementAgesMutation extends Mutation<void, Animal[]> {
  method = "POST";
  uri = "/increment-ages";
  responseSchema = [schemaAnimal];
}

export class AddAnimalMutation extends Mutation<{ animal: Object }, Animal> {
  method = "POST";
  uri = "/animals";
  responseSchema = schemaAnimal;
  getBody() {
    return this.props.animal;
  }
}

export default () => {
  const genId = ((id: number) => () => "id_" + ++id)(0);

  const animals: Animal[] = [
    {
      id: "id_max",
      name: "max",
      age: 14
    },
    {
      id: "id_doge",
      name: "doge",
      age: 5
    }
  ];
  function incrementAge() {
    animals.forEach(a => a.age++);
  }

  const world: Animal[] = [];
  for (let i = 0; i < 1000; i++) {
    world.push({
      id: "w_" + i,
      age: Math.ceil(10 * (1 + Math.cos(i * 77))),
      name: Array(6)
        .fill(null)
        .map((_, j) =>
          String.fromCharCode(
            Math.floor(
              (j === 0 ? 65 : 97) +
                26 *
                  0.5 *
                  (1 + Math.sin(i * 987.6 + 9999.8 * Math.cos(j * 43.2)))
            )
          )
        )
        .join("")
    });
  }

  const networkSync = (uri: string, method: string, body: any): any => {
    const q = URL.parse(uri, true);
    let m;
    if (method === "GET" && uri === "/animals") {
      return animals;
    }
    if (method === "GET" && q.pathname === "/world") {
      let { first, after } = { first: 30, after: null, ...q.query };
      first = Math.min(first, 100); // server is free to maximize the count number
      const cursorPrefixToNodeId = "C_"; // the cursor can be arbitrary and not necessarily === node.id
      let start = 0;
      if (after !== null) {
        const i = findIndex(world, a => "C_" + a.id === after);
        if (i === -1) {
          throw new Error("after cursor not found '" + after + "'");
        }
        start = i + 1;
      }
      const edges = world
        .slice(start, start + first)
        .map(node => ({ node, cursor: cursorPrefixToNodeId + node.id }));
      const hasNextPage = world.length > start + first;
      return { edges, pageInfo: { hasNextPage } };
    }
    if (method === "GET" && (m = uri.match(/^\/animals\/([^/]+)$/))) {
      const animal = animals.find(a => m && a.id === m[1]);
      if (!animal) throw "notfound";
      return animal;
    }
    if (method === "POST" && uri === "/animals") {
      const animal = { id: genId(), ...body };
      animals.push(animal);
      return animal;
    }
    if (method === "POST" && uri === "/animals") {
      const animal = { id: genId(), ...body };
      animals.push(animal);
      return animal;
    }
    if (method === "POST" && uri === "/increment-ages") {
      incrementAge();
      return animals;
    }
    throw "notfound";
  };
  return { networkSync, incrementAge };
};
