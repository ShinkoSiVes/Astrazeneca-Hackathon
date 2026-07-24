import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import "./SearchableSelect.css";

type SearchableSelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  emptyMessage: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function SearchableSelect({ label, value, options, placeholder, emptyMessage, disabled = false, onChange }: SearchableSelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const closeTimer = useRef<number | undefined>(undefined);
  const visibleOptions = options.filter((option) => option.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const close = () => {
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setQuery(value);
    }, 120);
  };

  return (
    <label className={`searchable-select ${disabled ? "is-disabled" : ""}`}>
      {label}
      <span className="searchable-select__control">
        <Search size={16} aria-hidden="true" />
        <input
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-label={label}
          autoComplete="off"
          disabled={disabled}
          onBlur={close}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        <ChevronDown size={17} aria-hidden="true" />
      </span>
      {open && !disabled && (
        <span className="searchable-select__menu" id={listId} role="listbox" aria-label={`${label} options`}>
          {visibleOptions.length ? visibleOptions.map((option) => (
            <button
              key={option}
              onMouseDown={(event) => { event.preventDefault(); onChange(option); setOpen(false); }}
              role="option"
              type="button"
            >
              {option}
            </button>
          )) : <span className="searchable-select__empty">{emptyMessage}</span>}
        </span>
      )}
    </label>
  );
}
