import { PureComponent } from "react";
import Fuse from "fuse.js";
import type FuseType from "fuse.js";

type Props<T> = {
  items: Array<T>;
  value: string;
  render: (_: Array<T>) => React.ReactNode;
  renderEmptySearch: () => React.ReactNode;
  fuseOptions?: Fuse.IFuseOptions<T>;
  // if true, it will display no items when value is empty
  filterEmpty?: boolean;
};
type State<T> = {
  results: T[];
};

class Search<T> extends PureComponent<Props<T>, State<T>> {
  static defaultProps = {
    fuseOptions: {},
    filterEmpty: false,
  };
  state = {
    results: [],
  };

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.initFuse(this.props);
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (prevProps.value !== this.props.value) {
      if (this.fuse) {
        const results = this.fuse.search(this.props.value);
        this.formatResults(results);
      }
    }

    if (prevProps.items !== this.props.items) {
      this.initFuse(this.props);
    }
  }

  fuse: FuseType<T> | null = null;

  initFuse(props: Props<T>) {
    const { fuseOptions, items, value } = props;
    this.fuse = new Fuse<T>(items, { ...fuseOptions });
    const results = this.fuse.search<T>(value);
    this.formatResults(results);
  }

  formatResults(results: Array<Fuse.FuseResult<T>>) {
    this.setState({
      results: results.map(r => r.item),
    });
  }

  render() {
    const { render, value, items, filterEmpty, renderEmptySearch } = this.props;
    const { results } = this.state;

    if (!filterEmpty && value === "") {
      return render(items);
    }

    if (value !== "" && !results.length) {
      return renderEmptySearch();
    }

    return render(results);
  }
}

export default Search;
