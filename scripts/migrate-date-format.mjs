#!/usr/bin/env node
/**
 * One-off: replace ad-hoc date formatting with @/utils/dateFormat
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(jsx|js|tsx|ts)$/.test(name)) files.push(p);
  }
  return files;
}

const IMPORT_LINE = "import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';\n";

const replacements = [
  [/new Date\(([^)]+)\)\.toLocaleDateString\(\s*'en-IN'\s*,\s*\{\s*day:\s*'2-digit'\s*,\s*month:\s*'2-digit'\s*,\s*year:\s*'numeric'\s*\}\s*\)/g, 'formatDate($1)'],
  [/new Date\(([^)]+)\)\.toLocaleDateString\(\s*'en-GB'\s*,\s*\{\s*day:\s*'2-digit'\s*,\s*month:\s*'short'\s*,\s*year:\s*'numeric'\s*\}\s*\)/g, 'formatDateShort($1)'],
  [/new Date\(([^)]+)\)\.toLocaleDateString\(\s*undefined\s*,\s*\{\s*month:\s*'short'\s*,\s*day:\s*'numeric'\s*,\s*year:\s*'numeric'\s*\}\s*\)/g, 'formatDateShort($1)'],
  [/new Date\(([^)]+)\)\.toLocaleDateString\(\s*undefined\s*,\s*\{\s*day:\s*'2-digit'\s*,\s*month:\s*'short'\s*,\s*year:\s*'numeric'\s*\}\s*\)/g, 'formatDateShort($1)'],
  [/new Date\(([^)]+)\)\.toLocaleString\(\s*'en-IN'\s*,\s*\{\s*dateStyle:\s*'medium'\s*,\s*timeStyle:\s*'short'\s*\}\s*\)/g, 'formatDateTime($1)'],
  [/new Date\(([^)]+)\)\.toLocaleString\(\s*'en-IN'\s*,\s*\{[^}]+\}\s*\)/g, 'formatDateTime($1)'],
  [/new Date\(([^)]+)\)\.toLocaleString\(\)/g, 'formatDateTime($1)'],
  [/new Date\(([^)]+)\)\.toLocaleDateString\(\)/g, 'formatDate($1)'],
];

function needsDateImport(content) {
  return (
    /\bformatDate(Time|Short)?\(/.test(content) ||
    /\btoInputDate\(/.test(content)
  );
}

function hasDateImport(content) {
  return content.includes("from '@/utils/dateFormat'") || content.includes('from "@/utils/dateFormat"');
}

function addImport(content) {
  if (hasDateImport(content)) return content;
  if (!needsDateImport(content)) return content;

  const importMatch = content.match(/^import .+$/m);
  if (!importMatch) return IMPORT_LINE + content;

  let lastImportEnd = 0;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportEnd = i;
  }
  lines.splice(lastImportEnd + 1, 0, "import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';");
  return lines.join('\n');
}

let changed = 0;
for (const file of walk(root)) {
  if (file.includes('utils/dateFormat.js') || file.includes('scripts/')) continue;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const [re, repl] of replacements) {
    content = content.replace(re, repl);
  }

  // Remove local duplicate formatters (simple cases)
  content = content.replace(
    /const formatDate = \(dateStr\) => \{[\s\S]*?return new Date\(dateStr\)\.toLocaleDateString[^;]+;\s*\};\s*\n/g,
    ''
  );

  content = addImport(content);

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
    console.log('updated', path.relative(root, file));
  }
}

console.log(`Done. ${changed} files updated.`);
