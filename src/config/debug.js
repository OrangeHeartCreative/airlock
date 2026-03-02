export const DEBUG_TOOLS_ENABLED = false;

export function isDebugFlagEnabled(flagName) {
  if (!DEBUG_TOOLS_ENABLED) {
    return false;
  }

  const globalLocation = typeof globalThis !== 'undefined' ? globalThis.location : undefined;
  const urlSearchParamsCtor = typeof globalThis !== 'undefined' ? globalThis.URLSearchParams : undefined;
  if (!globalLocation || !urlSearchParamsCtor) {
    return false;
  }

  const searchParams = new urlSearchParamsCtor(globalLocation.search);
  return searchParams.get(flagName) === '1';
}