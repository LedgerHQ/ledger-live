import { setEnvUnsafe } from "@ledgerhq/live-env";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Switch from "~/renderer/components/Switch";
import Trash from "~/renderer/icons/Trash";
import DeveloperExpandableRow from "../components/DeveloperExpandableRow";

type EnvVariableRow = {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
};

const INPUT_STYLE = { minWidth: 200, maxWidth: 300, width: "100%" } as const;

const isValidName = (name: string): boolean => name.trim() !== "";

const EnvVariableControl = ({
  row,
  onRemove,
  onUpdate,
}: {
  row: EnvVariableRow;
  onRemove: () => void;
  onUpdate: (updates: Partial<EnvVariableRow>) => void;
}) => {
  const [name, setName] = useState(row.name);
  const [value, setValue] = useState(row.value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(row.name);
    setValue(row.value);
  }, [row.name, row.value]);

  const nameTrimmed = name.trim();
  const valueTrimmed = value.trim();
  const isValid = isValidName(nameTrimmed);

  useEffect(() => {
    setError(isValid || !nameTrimmed ? null : "Invalid environment variable name");
  }, [isValid, nameTrimmed]);

  const handleEnable = () => {
    if (!isValid || !nameTrimmed || !valueTrimmed) return;
    if (setEnvUnsafe(nameTrimmed, valueTrimmed)) {
      onUpdate({ name: nameTrimmed, value: valueTrimmed, enabled: true });
    } else {
      setError("Failed to set environment variable");
    }
  };

  const handleDisable = () => {
    if (row.name.trim()) setEnvUnsafe(row.name.trim(), "");
    onUpdate({ enabled: false });
  };

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      handleEnable();
    } else {
      handleDisable();
    }
  };

  const handleRemove = () => {
    if (isValid && nameTrimmed) setEnvUnsafe(nameTrimmed, "");
    onRemove();
  };

  const handleNameChange = (name: string) => {
    setName(name);
    onUpdate({ name });
  };

  const handleValueChange = (value: string) => {
    setValue(value);
    onUpdate({ value });
  };

  const isSwitchDisabled = !isValid || !nameTrimmed || !valueTrimmed;
  const isValueInputDisabled = !nameTrimmed;
  const isValueEnabled = row.enabled;
  const valueInputStyle = { ...INPUT_STYLE, opacity: isValueEnabled ? 1 : 0.5 };

  return (
    <Box mb={3} py={1}>
      <Box horizontal flow={2} alignItems="center">
        <Input
          small
          style={INPUT_STYLE}
          onChange={handleNameChange}
          value={name}
          placeholder="Env name"
          data-testid={`${row.id}-envname-input`}
        />
        <Input
          small
          disabled={isValueInputDisabled}
          style={valueInputStyle}
          onChange={handleValueChange}
          value={value}
          placeholder="Env value"
          data-testid={`${row.id}-envvalue-input`}
        />
        <Switch
          isChecked={row.enabled}
          onChange={handleSwitchChange}
          disabled={isSwitchDisabled}
          data-testid={`${row.id}-switch`}
        />
        <Button
          size="sm"
          appearance="transparent"
          onClick={handleRemove}
          data-testid={`${row.id}-remove-button`}
        >
          <Trash size={16} />
        </Button>
      </Box>
      {error && (
        <Box mt={1} style={{ fontSize: 10, color: "red" }}>
          {error}
        </Box>
      )}
    </Box>
  );
};

export const EnvVariableContent = ({
  expanded,
  rows,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: {
  expanded?: boolean;
  rows: EnvVariableRow[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, updates: Partial<EnvVariableRow>) => void;
}) => {
  const canAddNewRow = rows.every(row => isValidName(row.name));

  return (
    <div>
      <div>Override env variables for testing</div>
      {expanded && (
        <>
          <div className="mt-16 py-8">
            {rows.map(row => (
              <EnvVariableControl
                key={row.id}
                row={row}
                onRemove={() => onRemoveRow(row.id)}
                onUpdate={updates => onUpdateRow(row.id, updates)}
              />
            ))}
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              appearance="accent"
              onClick={onAddRow}
              disabled={!canAddNewRow}
              data-testid="add-env-row-button"
            >
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const STORAGE_KEY = "env-variable-overrides";

const loadRowsFromStorage = (): EnvVariableRow[] => {
  try {
    const rows = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY) || "[]");
    return rows.map((row: EnvVariableRow) => ({
      ...row,
      enabled: row.enabled ?? false,
    }));
  } catch {
    return [];
  }
};

const saveRowsToStorage = (rows: EnvVariableRow[]) => {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const getMaxRowId = (rows: EnvVariableRow[]): number =>
  Math.max(
    0,
    ...rows.map(row => {
      const match = /^env-row-(\d+)$/.exec(row.id);
      return Number.parseInt(match?.[1] || "0", 10);
    }),
  );

const EnvVariableOverride = () => {
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState<EnvVariableRow[]>(loadRowsFromStorage);
  const rowIdCounter = useRef(getMaxRowId(rows));

  useEffect(() => {
    saveRowsToStorage(rows);
  }, [rows]);

  const createNewRow = (): EnvVariableRow => ({
    id: `env-row-${++rowIdCounter.current}`,
    name: "",
    value: "",
    enabled: false,
  });

  const handleAddRow = () => setRows(prev => [...prev, createNewRow()]);
  const handleRemoveRow = (id: string) => setRows(prev => prev.filter(row => row.id !== id));
  const handleUpdateRow = (id: string, updates: Partial<EnvVariableRow>) =>
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...updates } : row)));

  return (
    <DeveloperExpandableRow
      title="Environment Variables"
      desc={
        <EnvVariableContent
          expanded={expanded}
          rows={rows}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
          onUpdateRow={handleUpdateRow}
        />
      }
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      childrenAlignSelf="flex-start"
    />
  );
};

export default EnvVariableOverride;
