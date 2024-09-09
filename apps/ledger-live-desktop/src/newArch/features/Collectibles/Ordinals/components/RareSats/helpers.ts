import { mappingKeysWithIconAndName } from "../Icons";
import { MappingKeys } from "LLD/features/Collectibles/types/Ordinals";
import { IconProps } from "LLD/features/Collectibles/types/Collection";
import { RareSat } from "LLD/features/Collectibles/types/Ordinals";
import {
  Satributes,
  Subrange,
  SatRange,
  MockedRareSat,
  Sat,
  Icons,
} from "LLD/features/Collectibles/types/RareSats";

export const processSatType = (
  type: string,
  satributes: Satributes,
  icons: Icons,
  displayNames: string[],
  totalCount: number,
) => {
  const attribute = satributes[type as MappingKeys];
  if (attribute && attribute.count) {
    displayNames.push(type);
    if (mappingKeysWithIconAndName[type as MappingKeys]) {
      icons[type] = mappingKeysWithIconAndName[type as MappingKeys].icon;
    }
    totalCount = attribute.count;
  }
  return { displayNames, totalCount };
};

export const processSatTypes = (satTypes: string[], satributes: Satributes) => {
  let displayNames: string[] = [];
  let totalCount = 0;
  const icons: { [key: string]: ({ size, color, style }: IconProps) => JSX.Element } = {};

  satTypes.forEach(type => {
    const result = processSatType(type, satributes, icons, displayNames, totalCount);
    displayNames = result.displayNames;
    totalCount = result.totalCount;
  });

  return { displayNames, totalCount, icons };
};

export const processSubrange = (
  subrange: Subrange,
  satributes: Satributes,
  year: string,
  value: number,
) => {
  const { sat_types } = subrange;
  const { displayNames, totalCount, icons } = processSatTypes(sat_types, satributes);

  const name = displayNames
    .map(dn => mappingKeysWithIconAndName[dn.toLowerCase().replace(" ", "_") as MappingKeys]?.name)
    .filter(Boolean)
    .join(" / ");

  return {
    count: totalCount.toString() + (totalCount === 1 ? " sat" : " sats"),
    display_name: displayNames.join(" / "),
    year,
    utxo_size: value.toString(),
    icons,
    name,
  };
};

export const processSatRanges = (satRanges: SatRange[], satributes: Satributes) => {
  return satRanges.flatMap(range => {
    const { year, value, subranges } = range;
    return subranges.flatMap(subrange => processSubrange(subrange, satributes, year, value));
  });
};

export const processRareSat = (sat: Sat) => {
  const { extra_metadata } = sat;
  const satributes = extra_metadata.utxo_details.satributes as Satributes;
  const satRanges = extra_metadata.utxo_details.sat_ranges;
  return processSatRanges(satRanges, satributes);
};

export const processRareSats = (rareSats: MockedRareSat[]) => {
  return rareSats.flatMap(item => item.nfts.flatMap(processRareSat));
};

export const groupRareSats = (processedRareSats: RareSat[]) => {
  return processedRareSats.reduce(
    (acc, sat) => {
      if (!acc[sat.utxo_size]) {
        acc[sat.utxo_size] = [];
      }
      acc[sat.utxo_size].push(sat);
      return acc;
    },
    {} as Record<string, RareSat[]>,
  );
};

export const finalizeRareSats = (groupedRareSats: Record<string, RareSat[]>) => {
  return Object.entries(groupedRareSats).map(([utxo_size, sats]) => ({
    utxo_size,
    sats,
    isMultipleRow: sats.length > 1,
  }));
};
