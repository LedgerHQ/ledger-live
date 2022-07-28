import React from "react";
import { storiesOf } from "../storiesOf";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import Divider from "../../../src/components/Layout/Divider";

const DividerStory = () => {
  return (
    <Flex px={10}>
      <Text variant="h1">Lorem Ipsum</Text>
      <Divider />
      <Text variant="paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sit amet justo enim. Maecenas
        elementum justo eget velit laoreet, in interdum ex auctor. Nam quis augue quis justo
        venenatis consectetur. Cras eu ipsum consequat, mollis turpis sed, lobortis diam. Etiam
        convallis in sem in sagittis. Donec fringilla nibh a quam commodo, non accumsan mauris
        aliquet. Sed et lacus faucibus, ullamcorper erat eu, pretium felis. Curabitur ultrices,
        sapien at vulputate dapibus, turpis lorem pretium dui, ut accumsan enim massa vel magna.
        Mauris diam felis, rutrum sed nunc id, laoreet convallis libero. Praesent tempus mollis
        laoreet.
      </Text>
    </Flex>
  );
};

storiesOf((story) =>
  story("Layout/Divider", module)
    .add("Divider", () => <DividerStory />)
);
