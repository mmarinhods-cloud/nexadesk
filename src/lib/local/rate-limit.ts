const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, durationMs: number) {
  const now = Date.now();
  if (windows.size > 2000) {
    for (const [storedKey, window] of windows) if (window.resetAt <= now) windows.delete(storedKey);
  }
  const current = windows.get(key);
  if (!current || now >= current.resetAt) { windows.set(key, { count: 1, resetAt: now + durationMs }); return; }
  if (current.count >= max) throw new Error("Limite temporário atingido. Tente novamente em um minuto.");
  current.count += 1;
}
