import { PureComponent } from "react";
import Fuse from "fuse.js";
import type FuseType from "fuse.js";

type Props = {
  items: Array<Record<string, any>>;
  value: string;
  render: (_: Array<Record<string, any>>) => React.ReactNode;
  renderEmptySearch: () => React.ReactNode;
  fuseOptions?: Record<string, any>;
  // if true, it will display no items when value is empty
  filterEmpty?: boolean;
};
type State = {
  results: Array<Record<string, any>>;
};

class Search extends PureComponent<Props, State> {
  static defaultProps = {
    fuseOptions: {},
    filterEmpty: false,
  };
  state = {
    results: [],
  };

  componentWillMount() {
    this.initFuse(this.props);
  }

  componentDidUpdate(prevProps: Props) {
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

  fuse: FuseType<any> | null = null;

  initFuse(props: Props) {
    const { fuseOptions, items, value } = props;
    this.fuse = new Fuse(items, { ...fuseOptions });
    const results = this.fuse.search(value);
    this.formatResults(results);
  }

  formatResults(results: Array<Record<string, any>>) {
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
