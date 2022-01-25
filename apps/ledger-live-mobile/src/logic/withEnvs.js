// @flow
import React from "react";
import { changes, getAllEnvs } from "@ledgerhq/live-common/lib/env";
import hoistNonReactStatics from "hoist-non-react-statics";

const withEnvs = (Comp: any) => {
  class WithEnvs extends React.Component<*, { envs: { [string]: any } }> {
    state = {
      envs: getAllEnvs(),
    };

    sub: *;

    componentDidMount() {
      this.subscribe();
    }

    componentWillUnmount() {
      if (this.sub) {
        this.sub.unsubscribe();
      }
    }

    subscribe = () => {
      this.sub = changes.subscribe(() => {
        const envs = getAllEnvs();
        this.setState({ envs });
      });
    };

    render() {
      const { envs } = this.state;
      return <Comp {...this.props} envs={envs} />;
    }
  }

  hoistNonReactStatics(WithEnvs, Comp);

  return WithEnvs;
};

export default withEnvs;
