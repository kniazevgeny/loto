import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="field"><span>{label}</span>{children}</div>;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  compact = false,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  compact?: boolean;
  ariaLabel: string;
}) {
  return (
    <div className={`segmented-control ${compact ? "compact" : ""}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          className={value === option.value ? "active" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          key={option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RangeField({
  label, value, min, max, step = 1, unit = "", onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="range-row">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{value}{unit}</output>
      </div>
    </Field>
  );
}
