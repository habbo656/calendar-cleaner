import { useCallback, useState } from 'react';

/** Set of selected ids that resets to `defaults` whenever the candidate list changes. */
export function useSelection(defaults: string[]) {
  const key = defaults.join('\n');
  const [state, setState] = useState(() => ({ key, selected: new Set(defaults) }));

  // Reset during render when candidates change (avoids an extra effect pass).
  let current = state;
  if (state.key !== key) {
    current = { key, selected: new Set(defaults) };
    setState(current);
  }

  const toggle = useCallback((id: string) => {
    setState((prev) => {
      const selected = new Set(prev.selected);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      return { ...prev, selected };
    });
  }, []);

  const setAll = useCallback(
    (ids: string[]) => setState((prev) => ({ ...prev, selected: new Set(ids) })),
    [],
  );

  return { selected: current.selected, toggle, setAll };
}
