export function geographyMatches(
  eventGeographies: string[],
  serviceArea: string[],
): boolean {
  const serviceSet = new Set(serviceArea.map(normalize));
  return eventGeographies.some((place) => serviceSet.has(normalize(place)));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
