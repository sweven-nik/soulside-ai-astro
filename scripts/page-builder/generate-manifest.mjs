/**
 * Reads the Astro components and writes src/page-builder/manifest.json: every component's
 * props (type, allowed values, default, label/group) and slots (what kind of content each takes).
 * The Sanity block schemas and the page renderer are both built from this file.
 *
 *   npm run pagebuilder:manifest
 *
 * Re-run after adding a component or changing a component's Props or slots.
 */
import { parse } from '@astrojs/compiler';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript5';

const root = process.cwd();
const componentsDir = path.join(root, 'src/components');
const out = path.join(root, 'src/page-builder/manifest.json');

// Page chrome rendered by the page template, not offered as blocks.
const EXCLUDE = new Set(['GlobalEmbeds', 'GlobalNavbar', 'GlobalFooter', 'GlobalAnnouncementBar']);
const CATEGORY = {
  '1-globals': 'Globals',
  '2-sections': 'Sections',
  '3-layouts': 'Layouts',
  '4-elements': 'Elements',
  '5-buttons': 'Buttons',
  '6-utilities': 'Utilities',
  '7-icons': 'Icons',
  '8-interactive': 'Interactive',
  '9-collections': 'Collections',
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.astro') ? [path.join(dir, e.name)] : []));

// --- props --------------------------------------------------------------------

function literal(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  return undefined; // objects (placeholder image ids) and expressions are not editor defaults
}

function propKind(typeNode, text) {
  if (ts.isUnionTypeNode(typeNode) && typeNode.types.every((t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal))) {
    return { kind: 'enum', options: typeNode.types.map((t) => t.literal.text) };
  }
  if (/url\?: string/.test(text)) return { kind: 'image' };
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return { kind: 'boolean' };
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return { kind: 'number' };
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return { kind: 'string' };
  return { kind: 'unsupported', type: text };
}

function readProps(frontmatter) {
  const sf = ts.createSourceFile('c.ts', frontmatter, ts.ScriptTarget.Latest, true);
  const props = [];
  const defaults = {};
  sf.forEachChild(function visit(node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'Props') {
      for (const m of node.members) {
        if (!ts.isPropertySignature(m) || !m.type) continue;
        const comment = (ts.getLeadingCommentRanges(frontmatter, m.getFullStart()) ?? [])
          .map((r) => frontmatter.slice(r.pos, r.end))
          .join(' ')
          .match(/\/\*\*\s*(.*?)\s*\*\//)?.[1];
        props.push({ name: m.name.getText(sf), label: comment ?? null, ...propKind(m.type, m.type.getText(sf)) });
      }
    }
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer?.getText(sf) === 'Astro.props') {
      for (const el of node.name.elements) {
        const name = (el.propertyName ?? el.name).getText(sf);
        const value = literal(el.initializer);
        if (value !== undefined) defaults[name] = value;
      }
    }
    node.forEachChild(visit);
  });
  return props.map((p) => ({ ...p, ...(p.name in defaults ? { default: defaults[p.name] } : {}) }));
}

// --- slot usage on pages ------------------------------------------------------

const INLINE = new Set(['strong', 'em', 'b', 'i', 'span', 'a', 'br', 'sub', 'sup', 'u', 's', 'code']);
const RICH = new Set(['p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);
const usage = {}; // component -> slot -> Set(kind)

function noteSlot(component, slot, kind) {
  ((usage[component] ??= {})[slot] ??= new Set()).add(kind);
}

function childKind(node) {
  if (node.type === 'component') return node.name === 'Fragment' ? fragmentKind(node) : 'component';
  if (node.type === 'fragment') return fragmentKind(node);
  if (node.type === 'element') {
    if (node.name === 'svg') return 'svg';
    if (INLINE.has(node.name)) return 'inline';
    if (RICH.has(node.name)) return 'rich';
    return 'html';
  }
  if (node.type === 'text') return node.value.trim() ? 'text' : null;
  if (node.type === "expression") return null; // collection loops; handled by dedicated blocks
  if (node.type === "slot" || node.name === "slot") return null;
  return null;
}
function fragmentKind(node) {
  const kinds = new Set((node.children ?? []).map(childKind).filter(Boolean));
  if (kinds.has('component')) return 'component';
  if (kinds.has('svg')) return 'svg';
  if (kinds.has('rich') || kinds.has('html')) return 'rich';
  if (kinds.has('inline')) return 'inline';
  return 'text';
}

function scan(node) {
  for (const child of node.children ?? []) {
    if (child.type === 'component' && child.name !== 'Fragment') {
      for (const c of child.children ?? []) {
        const kind = childKind(c);
        if (!kind) continue;
        const slot = c.attributes?.find((a) => a.name === 'slot')?.value ?? 'default';
        noteSlot(child.name, slot, kind);
      }
    }
    scan(child);
  }
}

// --- slot kinds ---------------------------------------------------------------

const STRING_SLOT = /^(headingtext|heading|name|stat|label\d*|resourcetypename)$/;

// Slots whose content can't be inferred from page usage or name.
const OVERRIDES = {
  "ElementParagraph.default": "inline",
  "ElementRichTextLongForm.default": "rich",
  "ElementInlineTestimonial.statstat": "string",
  "ElementInlineTestimonial.testimonialtestimonial": "inline",
  "ElementInlineTestimonial.testimonialname": "string",
  "ElementInlineTestimonial.testimonialattribution": "inline",
  "ElementTestimonialBento.statstat": "string",
  "ElementTestimonialBento.testimonialbody": "inline",
  "ElementTestimonialBento.testimonialname": "string",
  "ElementTestimonialBento.testimonialattribution": "inline",
  "ElementTestimonialBento.testimonialbuttonlabel": "string",
};

// Slot kinds already in the manifest are kept: content in Sanity is stored in that shape, and the
// exported pages the kinds were learned from no longer exist once a page moves to the page builder.
const previous = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : { components: [] };
const previousKinds = Object.fromEntries(previous.components.flatMap((c) => c.slots.map((s) => [`${c.name}.${s.name}`, s.kind])));

function slotKind(component, slot) {
  if (previousKinds[`${component}.${slot}`]) return previousKinds[`${component}.${slot}`];
  if (OVERRIDES[`${component}.${slot}`]) return OVERRIDES[`${component}.${slot}`];
  const seen = usage[component]?.[slot];
  if (seen?.size) {
    if (seen.has('component') || seen.has('html') || seen.has('expression')) return 'blocks';
    if (seen.has('svg')) return 'svg';
    if (seen.has('rich')) return 'rich';
    if (seen.has('inline')) return 'inline';
    return STRING_SLOT.test(slot) ? 'string' : 'inline';
  }
  // Slots no page uses yet: infer from the name.
  if (/svg/.test(slot)) return 'svg';
  if (/blocks$/.test(slot)) return 'rich';
  if (STRING_SLOT.test(slot)) return 'string';
  if (/text$|description$/.test(slot)) return 'inline';
  return 'blocks';
}

// --- run ----------------------------------------------------------------------

const files = walk(componentsDir);
// Learn slot content from the pages only: inside components, slots are mostly forwarded (<slot slot="x">).
for (const file of walk(path.join(root, "src/pages"))) {
  const { ast } = await parse(fs.readFileSync(file, 'utf8'));
  scan(ast);
}

const components = [];
for (const file of files.sort()) {
  const name = path.basename(file, '.astro');
  if (EXCLUDE.has(name)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const template = source.slice(frontmatter.length + 8);
  const slotNames = [...new Set([...template.matchAll(/<slot(?:\s+name="([^"]+)")?[\s/>]/g)].map((m) => m[1] ?? 'default'))];
  const folder = path.relative(componentsDir, path.dirname(file));
  components.push({
    name,
    path: '/' + path.relative(root, file),
    category: CATEGORY[folder] ?? 'Elements',
    props: readProps(frontmatter),
    slots: slotNames.map((slot) => ({ name: slot, kind: slotKind(name, slot) })),
  });
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ generated: 'scripts/page-builder/generate-manifest.mjs — do not edit by hand', components }, null, 2) + '\n');
const unsupported = components.flatMap((c) => c.props.filter((p) => p.kind === 'unsupported').map((p) => `${c.name}.${p.name}: ${p.type}`));
console.log(`${components.length} components → ${path.relative(root, out)}`);
if (unsupported.length) console.log('Props without an editor field:', unsupported.join(', '));
