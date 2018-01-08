//@flow
import Mutation from "../../restlay/Mutation";

type Input = {
  echo: string
};

type Response = {
  echo: string
};

export default class HelloWorldMutation extends Mutation<Input, Response> {
  uri = "/helloworld";
  method = "POST";
  getBody() {
    const { echo } = this.props;
    return { echo };
  }
}
