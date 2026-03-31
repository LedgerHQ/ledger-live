import React from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectTriggerButton,
} from "@ledgerhq/lumen-ui-react";
import { Csv } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { getOperationTypeOptions, type HistoryTypeFilter } from "../utils/operationTypeOptions";
import { HistoryExportDialog } from "./HistoryExportDialog";

type Props = {
  selectedType: HistoryTypeFilter;
  onTypeChange: (type: HistoryTypeFilter) => void;
  onExportClick: () => void;
};

const options = getOperationTypeOptions();

export function HistoryActionsList({ selectedType, onTypeChange, onExportClick }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center gap-[12px]">
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger render={props => <SelectTriggerButton {...props} label="Type" />} />
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value} className="p-8">
              <SelectItemText>
                <div className="flex items-center gap-12">
                  {option.icon && <option.icon size={16} />}
                  {option.label}
                </div>
              </SelectItemText>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto">
        <HistoryExportDialog>
          <Button appearance="transparent" size="sm" icon={Csv} onClick={onExportClick}>
            {t("history.actionsBar.csv")}
          </Button>
        </HistoryExportDialog>
      </div>
    </div>
  );
}
