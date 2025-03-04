import { browserrouter as router, route } from "react-router-dom";
import { statemachineprovider, createstore } from "little-state-machine";
import step1 from "./step1";
import step2 from "./step2";
import result from "./result";

createstore({
  data: {
    firstname: '',
    lastname: '',
  }
});

export default function app() {
  return (
    <statemachineprovider>
      <router>
        <route exact path="/" component={step1} />
        <route path="/step2" component={step2} />
        <route path="/result" component={result} />
      </router>
    </statemachineprovider>
  );
}>
  );
};
