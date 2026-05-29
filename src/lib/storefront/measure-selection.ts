export function toggleMeasureSelection(
  selectedMeasures: string[],
  measure: string
): string[] {
  return selectedMeasures.includes(measure)
    ? selectedMeasures.filter((item) => item !== measure)
    : [...selectedMeasures, measure];
}
