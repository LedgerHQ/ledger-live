import React, { useCallback, useRef, useMemo, useState } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { InView } from "react-intersection-observer";
import { useDispatch, useSelector } from "react-redux";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import InfoCircle from "~/renderer/icons/InfoCircle";
import TriangleWarning from "~/renderer/icons/TriangleWarning";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { useDeepLinkHandler } from "~/renderer/hooks/useDeeplinking";
import { closeInformationCenter } from "~/renderer/actions/UI";
import useDateTimeFormat from "~/renderer/hooks/useDateTimeFormat";
import { notificationsContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { LocationContentCard, NotificationContentCard } from "~/types/dynamicContent";
import * as braze from "@braze/web-sdk";
import { setNotificationsCards } from "~/renderer/actions/dynamicContent";
import { track } from "~/renderer/analytics/segment";

const DateRowContainer = styled.div`
  padding: 4px 16px;
  background-color: ${({ theme }) => theme.colors.palette.background.default};
  border-radius: 4px;
  margin: 25px 0px;
`;
const levelThemes = {
  info: {
    title: "palette.text.shade100",
    text: "palette.text.shade50",
    background: undefined,
    icon: undefined,
    link: undefined,
    padding: undefined,
  },
  warning: {
    title: "white",
    text: "white",
    background: "orange",
    icon: "white",
    link: "white",
    padding: "16px",
  },
  alert: {
    title: "palette.text.shade100",
    text: "palette.text.shade50",
    background: "red",
    icon: "white",
    link: "white",
    padding: undefined,
  },
};
const getLevelTheme = (levelName: string) => {
  const levelData = levelThemes[levelName];
  if (levelData) {
    return levelData;
  }
  return levelThemes.info;
};
const UnReadNotifBadge = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${p => p.theme.colors.wallet};
  border-radius: 8px;
  position: absolute;
  top: calc(50% - 4px);
  left: 0px;
  z-index: 1;
`;
type DateRowProps = {
  date: Date;
};
const DateLabel = styled(Text).attrs({
  color: "palette.text.shade60",
  ff: "Inter|SemiBold",
  fontSize: "11px",
  lineHeight: "18px",
})`
  display: inline-block;

  &::first-letter {
    text-transform: uppercase;
  }
`;
function DateRow({ date }: DateRowProps) {
  const dateFormatter = useDateTimeFormat({
    dateStyle: "full",
  });
  return (
    <DateRowContainer>
      <DateLabel>{dateFormatter(date)}</DateLabel>
    </DateRowContainer>
  );
}
const ArticleRootContainer = styled.div`
  padding-left: ${p => (p.isRead ? 0 : 16)}px;
  position: relative;
`;
const ArticleContainer = styled(Box)`
  display: flex;
  flex-direction: row;
  border-radius: 4px;
`;
const ArticleRightColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;
type ArticleProps = {
  level: string;
  icon: string;
  title: string;
  text: string;
  link?: {
    label?: string;
    href: string;
  };
  utmCampaign?: string;
  isRead?: boolean;
};
const icons = {
  warning: {
    defaultIconColor: "orange",
    Icon: TriangleWarning,
  },
  info: {
    defaultIconColor: "wallet",
    Icon: InfoCircle,
  },
};
const getIcon = (iconName: string) => {
  const iconData = icons[iconName];
  if (iconData) {
    return iconData;
  }
  return icons.info;
};
type ArticleLinkProps = {
  label?: string;
  href: string;
  utmCampaign?: string;
  color?: string;
};
function ArticleLink({ label, href, utmCampaign, color }: ArticleLinkProps) {
  const { handler } = useDeepLinkHandler();
  const dispatch = useDispatch();
  const url = useMemo(() => {
    const url = new URL(href);
    url.searchParams.set("utm_medium", "announcement");
    if (utmCampaign) {
      url.searchParams.set("utm_campaign", utmCampaign);
    }
    return url;
  }, [href, utmCampaign]);
  const onLinkClick = useCallback(() => {
    const isDeepLink = url.protocol === "ledgerlive:";
    if (isDeepLink) {
      handler(null, url.href);
      dispatch(closeInformationCenter());
    } else openURL(url.href);
  }, [url, handler, dispatch]);
  return (
    <LinkWithExternalIcon
      color={color}
      onClick={onLinkClick}
      style={{
        marginTop: 15,
      }}
    >
      {label || href}
    </LinkWithExternalIcon>
  );
}
function Article({
  level = "info",
  icon = "info",
  title,
  text,
  link,
  utmCampaign,
  isRead,
}: ArticleProps) {
  const [isSeen] = useState(isRead);
  const levelTheme = getLevelTheme(level);
  const { Icon, defaultIconColor } = getIcon(icon);
  return (
    <ArticleRootContainer isRead={isSeen}>
      <ArticleContainer
        bg={levelTheme.background}
        py={levelTheme.padding}
        px="16px"
        color={levelTheme.icon || defaultIconColor}
      >
        <ArticleRightColumnContainer>
          <Box horizontal alignItems="center" justifyContent="center">
            <Icon size={15} />
            <Box ml={2} flex="1">
              <Text
                color={levelTheme.title}
                ff="Inter|SemiBold"
                fontSize="14px"
                lineHeight="16.94px"
              >
                {title}
              </Text>
            </Box>
          </Box>

          <Text
            mt="4px"
            color={levelTheme.text}
            ff="Inter|Medium"
            fontSize="12px"
            lineHeight="18px"
          >
            {text}
          </Text>
          {link ? (
            <ArticleLink
              href={link.href}
              label={link.label}
              utmCampaign={utmCampaign}
              color={levelTheme.link}
            />
          ) : null}
        </ArticleRightColumnContainer>
      </ArticleContainer>
      {isSeen ? null : <UnReadNotifBadge />}
    </ArticleRootContainer>
  );
}
const PanelContainer: ThemedComponent<any> = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
`;
const Separator = styled.div`
  margin: 25px 0px;
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.palette.text.shade10};
`;

function startOfDayTime(date: Date): number {
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return startOfDate.getTime();
}

export const groupNotifications = (
  notifs: NotificationContentCard[],
): {
  day: Date | null | undefined;
  data: NotificationContentCard[];
}[] => {
  // first group by published_at or if theres a priority set
  const announcementsByDayOrPriority: Record<string, NotificationContentCard[]> = notifs.reduce(
    (sum, notif: NotificationContentCard) => {
      // group by publication date or if priority set in a group 0
      const k = startOfDayTime(notif.createdAt);

      return { ...sum, [`${k}`]: [...(sum[k] || []), notif] };
    },
    {},
  );
  // map over the keyed groups and sort them by priority and date
  return Object.keys(announcementsByDayOrPriority)
    .filter(
      key => announcementsByDayOrPriority[key] && announcementsByDayOrPriority[key].length > 0, // filter out potential empty groups
    )
    .map(key => Number(key)) // map every string to a number for sort evaluation
    .sort((a, b) => {
      const aa = a === 0 ? Infinity : a; // sort out by timestamp key while keeping priority set announcements on top

      const bb = b === 0 ? Infinity : b; // this can work because a and b cannot be equal to 0 at same time

      return bb - aa;
    })
    .map(date => ({
      day: date === 0 ? null : new Date(date),
      // format Day if available
      data: announcementsByDayOrPriority[`${date}`],
    }));
};

export function AnnouncementPanel() {
  const dispatch = useDispatch();
  const cachedNotifications = braze
    .getCachedContentCards()
    .cards.filter(
      card => card.extras?.plarform === "desktop" && card.extras?.location === LocationContentCard,
    );
  const notificationsCards = useSelector(notificationsContentCardSelector);

  const orderedNotificationsCards = useMemo(
    () =>
      (notificationsCards ?? []).sort(
        (notif: NotificationContentCard, nt: NotificationContentCard) =>
          nt.createdAt.getDate() - notif.createdAt.getDate(),
      ),
    [notificationsCards],
  );

  const logCardImpression = useCallback(
    (cardId: string) => {
      const card = orderedNotificationsCards.find(n => n.id === cardId);

      const currentCard = cachedNotifications.find(card => card.id === cardId);
      braze.logContentCardImpressions(currentCard ? [currentCard] : []);

      const cards = orderedNotificationsCards.map(n => {
        if (card && n.id === card.id) {
          return { ...n, viewed: true };
        } else {
          return n;
        }
      });

      dispatch(setNotificationsCards(cards));
    },
    [orderedNotificationsCards, cachedNotifications, dispatch],
  );

  const timeoutByUUIDn = useRef({});
  const handleInViewNotif = useCallback(
    (visible, uuid) => {
      const timeouts = timeoutByUUIDn.current;
      if (orderedNotificationsCards.find(n => !n.viewed) && visible && !timeouts[uuid]) {
        timeouts[uuid] = setTimeout(() => {
          logCardImpression(uuid);
          delete timeouts[uuid];
        }, 1000);
      }
      if (!visible && timeouts[uuid]) {
        clearTimeout(timeouts[uuid]);
        delete timeouts[uuid];
      }
    },
    [logCardImpression, orderedNotificationsCards],
  );

  const onClickNotif = useCallback((card: NotificationContentCard) => {
    track("contentcard_clicked", {
      contentcard: card.title,
      link: card.path || card.url,
      campaign: card.id,
      page: "notification_center",
    });
  }, []);

  if (!notificationsCards) {
    return (
      <PanelContainer>
        <Text
          color="palette.text.shade100"
          ff="Inter|SemiBold"
          fontSize="18px"
          lineHeight="21.78px"
          textAlign="center"
        >
          <Trans i18nKey="informationCenter.announcement.emptyState.title" />
        </Text>
        <Text
          mt="8px"
          color="palette.text.shade50"
          ff="Inter|Regular"
          fontSize="13px"
          lineHeight="15.73px"
          textAlign="center"
        >
          <Trans i18nKey="informationCenter.announcement.emptyState.desc" />
        </Text>
      </PanelContainer>
    );
  }
  return (
    <ScrollArea hideScrollbar>
      <Box py="32px">
        {groupNotifications(notificationsCards ?? []).map((group, index) => (
          <React.Fragment key={index}>
            {group.day ? <DateRow date={group.day} /> : null}
            {group.data.map(({ title, description, path, url, viewed, id, cta }, index) => (
              <React.Fragment key={id}>
                <InView
                  as="div"
                  onChange={visible => handleInViewNotif(visible, id)}
                  onClick={() => onClickNotif(group.data[index])}
                >
                  <Article
                    title={title}
                    text={description}
                    isRead={viewed}
                    level={""}
                    icon={""}
                    link={{
                      label: cta,
                      href: url || path || "https://ledger.com",
                    }}
                  />
                </InView>
                {index < group.data.length - 1 ? <Separator /> : null}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </Box>
    </ScrollArea>
  );
}
