import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { VirtualList } from "./VirtualList";
import { action } from "@storybook/addon-actions";
import { expect, userEvent, waitFor, within } from "@storybook/test";

const items = Array.from({ length: 50 }, (_, i) => ({ i }));

const meta: Meta<typeof VirtualList<{ i: number }>> = {
  component: VirtualList,
  decorators: [
    Story => (
      <div style={{ height: "400px" }}>
        <Story />
      </div>
    ),
  ],
  title: "PreLdls/Components/VirtualList",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A virtualized list component that renders only the visible items in a scrollable container using the `useVirtualizer` hook from `@tanstack/react-virtual`. It supports pagination and custom item rendering.",
      },
    },
  },
  argTypes: {
    itemHeight: {
      description: "Height of each item in the list.",
    },
    overscan: {
      description:
        "Number of extra items to render outside the visible viewport for smoother scrolling.",
      table: {
        defaultValue: {
          summary: "5",
        },
      },
    },
    LoadingComponent: {
      description:
        "React component or node to display when the list is loading additional items. If not provided, a default loading spinner will be used.",
    },
    isLoading: {
      description: "Indicates whether new items are currently being loaded.",
    },
    hasNextPage: {
      description:
        "Indicates if there are more items to load. If true, the list will trigger loading more items when scrolled to the end.",
      defaultValue: {
        summary: "false",
      },
    },
    threshold: {
      description:
        "Number of items to check before the end of the list to trigger loading more items.",
      defaultValue: {
        summary: "5",
      },
    },
    onVisibleItemsScrollEnd: {
      description:
        "Callback function to be called when the user scrolls to the end of the visible items. This can be used to load more items when the user reaches the end of the list.",
    },
    renderItem: {
      description:
        "Function to render each item in the list. Receives the index of the item as an argument and should return a React node.",
    },
    scrollToTop: {
      description:
        "When set to true, the list will scroll to the top. This is useful when the items change and you want to reset the scroll position.",
    },
  },
  args: {
    itemHeight: 64,
    LoadingComponent: undefined,
    isLoading: false,
    overscan: 5,
    hasNextPage: false,
    threshold: 5,
    onVisibleItemsScrollEnd: () => {},
    items,
    renderItem: ({ i }: { i: number }) => <h1 tabIndex={i}>Item #{i}</h1>,
    scrollToTop: false,
  },
};
export default meta;

type Story = StoryObj<typeof VirtualList<{ i: number }>>;

export const Default: Story = {
  args: {
    itemHeight: 50,
    overscan: 5,
    items,
    renderItem: ({ i }: { i: number }) => (
      <div style={{ height: 50, backgroundColor: "lightblue", border: "1px solid black" }}>
        Item {i}
      </div>
    ),
  },
};

export const WithCustomLastRow: Story = {
  render: args => {
    const items = Array.from({ length: 5 }, (_, i) => i + 1);

    return (
      <VirtualList
        {...args}
        items={items}
        renderItem={item => (
          <div style={{ height: 50, backgroundColor: "lightgreen", border: "1px solid black" }}>
            Item {item}
          </div>
        )}
        bottomComponent={
          <div style={{ height: 50, backgroundColor: "lightcoral" }}>End of List</div>
        }
      />
    );
  },
};
export const WithPagination: Story = {
  render: args => {
    const [items, setItems] = useState(Array.from({ length: 50 }, (_, i) => i));
    const [isFetching, setIsFetching] = useState(false);

    const handleFetchNextPage = async () => {
      action("fetchNextPage")();
      if (isFetching) return;
      setIsFetching(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setItems(prev => [...prev, ...Array.from({ length: 50 }, (_, i) => prev.length + i)]);
      setIsFetching(false);
    };

    return (
      <VirtualList
        {...args}
        isLoading={isFetching}
        onVisibleItemsScrollEnd={handleFetchNextPage}
        hasNextPage={true}
        items={items}
        renderItem={item => (
          <div style={{ height: 50, backgroundColor: "lightgreen", border: "1px solid black" }}>
            Item {item}
          </div>
        )}
      />
    );
  },
  args: {
    itemHeight: 50,
    overscan: 5,
    hasNextPage: true,
    isLoading: false,
  },
};

export const TestVirtualList: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const visibleItems = canvas.getAllByText(/Item #/i);
    const firstVisibleItem = visibleItems[0];
    const lastVisibleItem = visibleItems[visibleItems.length - 1];

    // need to add 5 due to the overscan set to 5 (it renders 5 items before and after the visible items)
    await expect(visibleItems.length).toBeLessThanOrEqual(12);

    await expect(firstVisibleItem).toBeInTheDocument();

    await userEvent.pointer([
      { keys: "[TouchA>]", target: lastVisibleItem },
      { target: firstVisibleItem },
      { keys: "[/TouchA]" },
    ]);

    await waitFor(() => expect(firstVisibleItem).not.toBeInTheDocument());
  },
};
