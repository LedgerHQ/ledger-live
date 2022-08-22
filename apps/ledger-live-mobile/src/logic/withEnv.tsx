import React from "react";
import { changes, getAllEnvs } from "@ledgerhq/live-common/env";
import type { EnvName } from "@ledgerhq/live-common/env";
import hoistNonReactStatics from "hoist-non-react-statics";

const withEnv =
  (name: EnvName, propName = "env") =>
  (Comp: any) => {
    class WithEnv extends React.Component<
      any,
      {
        env: any;
      }
    > {
      state = {
        env: getAllEnvs()[name],
      };
      sub: any;

      componentDidMount() {
        this.subscribe();
      }

      componentWillUnmount() {
        if (this.sub) {
          this.sub.unsubscribe();
        }
      }

      subscribe = () => {
        this.sub = changes.subscribe(({ name: envName, value }) => {
          if (envName === name) {
            this.setState({
              env: value,
            });
          }
        });
      };

      render() {
        const { env } = this.state;
        const envProps = {
          [propName]: env,
        };
        return <Comp {...this.props} {...envProps} />;
      }
    }

    hoistNonReactStatics(WithEnv, Comp);
    return WithEnv;
  };

export default withEnv;
