/**
 * Deduplicates an array of incidents strictly by unique ID or eventId
 * Fallback to category + coordinates if id is missing.
 */
export function deduplicateIncidents(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key =
      item.id ||
      item.eventId ||
      (item.coordinates
        ? `${item.category}_${item.coordinates.lat}_${item.coordinates.lng}`
        : null);

    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
