import React, { useEffect, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import releaseNotes from "../../../../release-notes.json";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import TrackPage from "~/renderer/analytics/TrackPage";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Markdown, { Notes } from "~/renderer/components/Markdown";
type Props = {
  onClose: () => void;
};
type RenderContentProps = {
  notes: Array<{
    // eslint-disable-next-line camelcase
    tag_name: string;
    body: string;
  }>;
};
const Title = styled(Text).attrs(() => ({
  ff: "Inter",
  fontSize: 5,
  color: "palette.text.shade100",
}))``;
const RenderContent = ({ notes }: RenderContentProps) => {
  const { t } = useTranslation();
  if (notes.length) {
    return notes.map(note => (
      <Notes mb={6} key={note.tag_name}>
        <Title>
          {t("releaseNotes.version", {
            versionNb: note.tag_name,
          })}
        </Title>
        <Markdown>{note.body}</Markdown>
      </Notes>
    ));
  }
  return (
    <Box horizontal alignItems="center">
      <Spinner
        size={32}
        style={{
          margin: "auto",
        }}
      />
    </Box>
  );
};
const RenderContentMemo = memo(RenderContent);
const ReleaseNotesBody = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    setNotes(releaseNotes);
  }, []);
  return (
    <ModalBody
      onClose={onClose}
      title={t("releaseNotes.title")}
      render={() => (
        <Box
          relative
          style={{
            height: 500,
          }}
          px={5}
          pb={8}
        >
          <TrackPage category="Modal" name="ReleaseNotes" />
          <RenderContentMemo notes={notes} />
        </Box>
      )}
      renderFooter={() => (
        <Box horizontal justifyContent="flex-end">
          <Button onClick={onClose} primary>
            {t("common.continue")}
          </Button>
        </Box>
      )}
    />
  );
};
export default ReleaseNotesBody;
