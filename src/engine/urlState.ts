export function serializeState(params: Record<string, any>): string {
  try {
    const json = JSON.stringify(params);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

export function deserializeState(encoded: string): Record<string, any> | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getStateFromHash(): Record<string, any> | null {
  const hash = window.location.hash;
  const match = hash.match(/[#&]state=([^&]*)/);
  if (!match) return null;
  return deserializeState(match[1]);
}

export function pushStateToHash(params: Record<string, any>): void {
  const encoded = serializeState(params);
  const newHash = `#state=${encoded}`;
  // Use replaceState to avoid polluting history
  history.replaceState(null, '', newHash);
}
