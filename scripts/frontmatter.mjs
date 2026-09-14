// Deliberately small YAML subset: flat keys with JSON strings/string arrays.
// JSON quoting is valid YAML and safely represents colons, quotes and escapes.
// Reject unsupported YAML instead of guessing at how a client will parse it.
export function splitFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return { meta: null, raw: "", body: text };
  const meta = Object.create(null);
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+): (.+)$/);
    if (!field || Object.hasOwn(meta, field[1])) throw new Error(`Invalid or duplicate frontmatter field: ${line}`);
    let value;
    try { value = JSON.parse(field[2]); }
    catch { throw new Error(`Frontmatter ${field[1]} must be a JSON-quoted string or string array`); }
    if (typeof value !== "string" && !(Array.isArray(value) && value.every(v => typeof v === "string"))) {
      throw new Error(`Unsupported frontmatter value for ${field[1]}`);
    }
    if (field[1] !== "allowed-tools" && typeof value !== "string") throw new Error(`${field[1]} must be a string`);
    meta[field[1]] = value;
  }
  return { meta, raw: match[1], body: match[2] };
}

export function formatFrontmatter(meta) {
  return `---\n${Object.entries(meta).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n`;
}
