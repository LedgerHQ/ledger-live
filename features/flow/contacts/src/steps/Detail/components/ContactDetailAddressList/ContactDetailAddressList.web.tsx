import React, { useEffect, useRef } from "react";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRowIntent } from "../../types";
import { ContactDetailAddressNetworkSection } from "../ContactDetailAddressNetworkSection/ContactDetailAddressNetworkSection.web";

const COMPACT_BAR_HEIGHT_PX = 80;

type ContactDetailAddressListProps = Readonly<{
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
  onCollapseChange: (collapsed: boolean) => void;
  header: React.ReactNode;
}>;

export function ContactDetailAddressList({
  addressGroups,
  onAddressRowPress,
  onCollapseChange,
  header,
}: ContactDetailAddressListProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => onCollapseChange(!entry.isIntersecting),
      { root: container, threshold: 0, rootMargin: `-${COMPACT_BAR_HEIGHT_PX}px 0px 0px 0px` },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onCollapseChange]);

  return (
    <div
      ref={containerRef}
      className="scrollbar-custom isolate min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"
      data-testid="contacts-detail-address-list"
    >
      {header}
      <div ref={sentinelRef} aria-hidden="true" className="h-px pointer-events-none" />
      <div className="flex flex-col gap-24 px-16 pb-32">
        {addressGroups.map(group => (
          <ContactDetailAddressNetworkSection
            key={group.networkId}
            group={group}
            onAddressRowPress={onAddressRowPress}
          />
        ))}
      </div>
    </div>
  );
}
