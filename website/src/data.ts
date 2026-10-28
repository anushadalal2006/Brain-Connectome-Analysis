import { useEffect, useState } from 'react';

// Every number on the site comes from public/data/*.json. Each file is
// fetched once and shared between pages.
const cache = new Map<string, Promise<unknown>>();

export function loadJSON<T>(name: string): Promise<T> {
  let p = cache.get(name);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/${name}`).then((r) => {
      if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(name));
    cache.set(name, p);
  }
  return p as Promise<T>;
}

/** Returns the parsed JSON file, or null while loading / on error. */
export function useJSON<T>(name: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    loadJSON<T>(name)
      .then((d) => alive && setData(d))
      .catch((err) => console.error(`Error loading ${name}:`, err));
    return () => {
      alive = false;
    };
  }, [name]);
  return data;
}

/** Placeholder shown while a value is loading. */
export const PENDING = '…';
