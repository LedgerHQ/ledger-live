import React, { useState, useCallback } from "react";
import { Button, ScrollView } from "react-native";
import { action } from "@storybook/addon-actions";
import { ComponentStory } from "@storybook/react-native";
import BottomDrawer from "../../../../src/components/Layout/Modals/BottomDrawer";
import { Alert, Text } from "../../../../src/components";
import { Icons } from "../../../../src/assets";

export default {
  title: "Layout/Drawer/Bottom",
  component: BottomDrawer,
};

const Template = (args: typeof BaseStoryArgs & typeof WithoutStoryArgs) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      <Button onPress={openModal} title="Open Drawer" />
      <BottomDrawer
        isOpen={isOpen}
        onClose={() => {
          action("onClose")();
          setIsOpen(false);
        }}
        {...(args.noHeader
          ? {}
          : {
              ...args,
              Icon: Icons.TrashMedium,
            })}
        noCloseButton={args.noCloseButton}
      >
        <Alert type="info" showIcon={false} title="Example children (Alert component)" />
      </BottomDrawer>
    </>
  );
};
export const BaseStory: ComponentStory<typeof BottomDrawer> = Template.bind({});
BaseStory.storyName = "BottomDrawer";
const BaseStoryArgs = {
  noHeader: false,
  title: "title",
  description: "Description",
  subtitle: "Subtitle",
  noCloseButton: false,
};
BaseStory.args = BaseStoryArgs;

export const WithoutHeaderStory: ComponentStory<typeof BottomDrawer> = Template.bind({});
WithoutHeaderStory.storyName = "BottomDrawer (no header)";
const WithoutStoryArgs = {
  noHeader: true,
  noCloseButton: false,
};
WithoutHeaderStory.args = WithoutStoryArgs;

export const ScrollViewStory = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      <Button onPress={openModal} title="Open Drawer" />
      <BottomDrawer
        isOpen={isOpen}
        onClose={() => {
          action("onClose")();
          setIsOpen(false);
        }}
        title={args.title}
        description={args.description}
        subtitle={args.subtitle}
        Icon={Icons.TrashMedium}
      >
        <ScrollView>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam sit amet mollis sem.
            Aliquam ut lacus sapien. Mauris eu odio nec tellus ultricies malesuada. Curabitur
            tristique magna sed nisi ultricies iaculis vitae id massa. Etiam lobortis eu ipsum
            ultricies accumsan. Nullam semper accumsan convallis. Cras vitae elit vitae libero
            dictum luctus nec nec mi. Curabitur ex tortor, eleifend eget varius eget, commodo non
            odio. Praesent vehicula nibh nulla, in consequat sem feugiat faucibus. Duis ut eleifend
            lectus. Praesent lacus libero, iaculis vitae consequat ut, aliquam malesuada sem. Ut
            venenatis justo vitae molestie auctor. Vestibulum vel ante est. Orci varius natoque
            penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus vehicula,
            felis eu dignissim laoreet, ligula elit ultricies urna, vitae luctus augue sem vel odio.
            Donec justo nunc, dapibus ac nulla eget, tincidunt iaculis est. Curabitur non dui id
            nibh maximus pulvinar nec vitae nisi. Donec dui lorem, feugiat sit amet venenatis
            dictum, placerat ac metus. Donec ut convallis enim. Sed gravida neque rhoncus, mollis
            dui in, convallis dolor. Duis vehicula euismod erat id convallis. Duis semper ante non
            ipsum cursus hendrerit. Nunc vitae blandit dui. Sed sed lorem vel nisi hendrerit cursus
            vitae ut odio. Sed vel ligula at nisi suscipit tempor tristique id turpis. Donec
            maximus, felis eu fermentum facilisis, magna eros pretium nisl, id tempor quam risus at
            massa. Aliquam dictum luctus turpis, eget imperdiet ligula iaculis id. Pellentesque ut
            enim eget arcu dapibus placerat eu in urna. Vivamus ut sapien non nibh suscipit
            vulputate vitae et augue. Suspendisse convallis neque nec auctor finibus. Nam viverra
            tellus eget pharetra bibendum. Aenean odio nisl, gravida vel auctor quis, tempor at
            enim. Morbi sollicitudin ex diam, id malesuada tellus porttitor at. Curabitur laoreet
            justo quis lorem mollis, at bibendum elit cursus. Morbi malesuada velit vel interdum
            feugiat. Nam auctor ipsum et augue fringilla, eu eleifend ex faucibus. Nulla metus nisi,
            vehicula vel euismod ut, facilisis eu augue. Suspendisse sagittis pharetra magna vel
            cursus. Nunc euismod id ipsum eu feugiat. In venenatis at magna eu vestibulum. Integer
            ultrices ipsum ut tortor rutrum, at facilisis ipsum venenatis. Suspendisse at nulla at
            ex mattis pulvinar sed ut nisl. Nulla facilisi. Nunc mattis, diam nec lacinia pharetra,
            velit ligula congue nisi, porta porta enim mi eu nunc. Etiam elementum nisl in dictum
            luctus. Nullam vulputate arcu ante, nec congue tortor efficitur nec. Donec eleifend
            rutrum nunc sit amet vehicula. Donec malesuada arcu vel fringilla elementum. Sed varius
            mauris a eros efficitur, nec hendrerit est pulvinar. Mauris at purus vel augue fermentum
            posuere. In consequat id lectus quis pellentesque. Phasellus leo lectus, tempor vel
            neque et, eleifend interdum risus. Proin suscipit nulla sed eros semper, non molestie
            ante ultrices. Nullam pellentesque porttitor urna eleifend porta. Integer quis tincidunt
            turpis, ut venenatis tortor. Nullam sed pulvinar ex, quis laoreet erat.
          </Text>
          <Text variant={"h2"}>Lorement Ipsument</Text>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc neque libero, rhoncus ut
            congue ut, vehicula sit amet mauris. Pellentesque malesuada quis lorem ut condimentum.
            Donec lacinia elit sed ante auctor, dignissim porttitor magna feugiat. Mauris auctor
            libero sem, in ullamcorper ligula iaculis vel. Curabitur eleifend, mi at convallis
            efficitur, ligula orci tristique quam, vel hendrerit nisi orci non justo. Proin
            facilisis felis ut fermentum bibendum. Nullam et enim nibh. Vestibulum eu feugiat lacus,
            ac hendrerit ante. Quisque gravida, ex quis venenatis scelerisque, turpis velit ornare
            nulla, scelerisque gravida tortor dolor nec orci. Quisque quis odio fermentum, luctus
            felis eget, ornare lorem. Nulla ornare iaculis neque id ultricies. Curabitur eget tempor
            nisl. Suspendisse ante lectus, pellentesque eget porta ac, auctor eu purus. Quisque eu
            turpis sed mi ullamcorper luctus non sed metus. Cras luctus congue orci a interdum.
            Morbi a tincidunt augue. Maecenas nec cursus ex, malesuada cursus nisi. Curabitur vitae
            dui pharetra, vulputate ipsum nec, iaculis lorem. Praesent non egestas elit. Aliquam
            faucibus accumsan orci, interdum aliquet purus dictum in. Aliquam rhoncus vestibulum
            nisi, laoreet consequat diam varius ac. Cras vel aliquet elit. Duis commodo vel ante id
            aliquet. Maecenas volutpat dictum rutrum. Duis eget sapien lacus. Fusce commodo interdum
            interdum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vivamus molestie
            dolor eu accumsan pellentesque. Maecenas sodales augue et arcu feugiat, sit amet
            sollicitudin lacus mollis.
          </Text>
        </ScrollView>
      </BottomDrawer>
    </>
  );
};
ScrollViewStory.storyName = "BottomDrawer (with ScrollView)";
ScrollViewStory.args = {
  ...BaseStory.args,
};
