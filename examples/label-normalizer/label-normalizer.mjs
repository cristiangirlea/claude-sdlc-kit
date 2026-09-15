export function normalizeLabels(labels) {
  if (!Array.isArray(labels)) throw new TypeError("labels must be an array");
  const normalized = new Set();
  for (const label of labels) {
    if (typeof label !== "string") throw new TypeError("each label must be a string");
    const value = label.trim().toLowerCase();
    if (value) normalized.add(value);
  }
  return [...normalized];
}
