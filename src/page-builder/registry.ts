import manifestJson from './manifest.json';
import type { ManifestComponent } from './fields';

// Every component the manifest knows about, keyed by block type (= component name).
const modules = import.meta.glob<{ default: any }>('/src/components/**/*.astro', { eager: true });

export const registry = Object.fromEntries(
  (manifestJson.components as ManifestComponent[]).map((c) => [c.name, { ...c, Component: modules[c.path]?.default }]),
);
