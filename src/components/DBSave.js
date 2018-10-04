// @flow
import { Component } from "react";
import throttle from "lodash/throttle";
import { connect } from "react-redux";
import db from "../db";
import type { State } from "../reducers";

const instances = [];

export const flushAll = () => Promise.all(instances.map(i => i.save.flush()));

class DBSave extends Component<{
  dbKey: string,
  state: State,
  hasChanged: (next: State, prev: State) => boolean,
  lense: (s: State) => any,
  throttle: number,
}> {
  componentDidUpdate({ state }) {
    if (this.props.hasChanged(state, this.props.state)) {
      this.save();
    }
  }

  componentWillMount() {
    instances.push(this);
  }

  componentWillUnmount() {
    this.save.cancel();
    const i = instances.indexOf(this);
    if (i !== -1) {
      instances.splice(i, 1);
    }
  }

  save = throttle(() => {
    const startTime = Date.now();
    const { lense, dbKey, state } = this.props;
    return db.save(dbKey, lense(state)).then(
      () => {
        if (__DEV__) {
          /* eslint-disable no-console */
          console.log(
            `${dbKey} DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
          );
          /* eslint-enable no-console */
        }
      },
      e => {
        console.error(e);
      },
    );
  }, this.props.throttle || 500);

  render() {
    return null;
  }
}

export default connect(state => ({ state }))(DBSave);
