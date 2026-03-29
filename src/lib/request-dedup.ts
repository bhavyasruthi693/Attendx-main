// Request deduplication to prevent duplicate simultaneous requests
// Useful for preventing double-submits on login

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_TIMEOUT = 5000; // 5 seconds

/**
 * Deduplicate identical simultaneous requests
 * If the same request is made twice within 5 seconds, return the cached promise
 * 
 * Example:
 *   POST /login with same body within 5s → returns same promise
 *   Prevents accidental double-clicks from creating two login attempts
 */
export async function deduplicateRequest<T>(
  method: string,
  url: string,
  body?: string,
  fetch_fn?: (url: string, options: RequestInit) => Promise<Response>
): Promise<T> {
  const key = `${method}:${url}:${body || ""}`
  const now = Date.now()
  
  // Check if we have a pending request for this
  const pending = pendingRequests.get(key)
  if (pending && now - pending.timestamp < REQUEST_TIMEOUT) {
    console.debug(`[Dedup] Returning cached promise for ${key}`)
    return pending.promise
  }
  
  // Create new request
  const fetch_impl = fetch_fn || fetch
  const promise = fetch_impl(url, {
    method,
    headers: method !== "GET" ? { "Content-Type": "application/json" } : {},
    body: body && method !== "GET" ? body : undefined,
  })
    .then(r => r.json())
    .catch(err => {
      // Remove from cache on error
      pendingRequests.delete(key)
      throw err
    })
    .finally(() => {
      // Auto-remove after REQUEST_TIMEOUT
      setTimeout(() => pendingRequests.delete(key), REQUEST_TIMEOUT)
    })
  
  // Store in cache
  pendingRequests.set(key, { promise, timestamp: now })
  
  return promise
}

/**
 * Clear all pending request cache
 */
export function clearRequestCache() {
  pendingRequests.clear()
}

/**
 * Check if a request is currently pending
 */
export function isRequestPending(method: string, url: string, body?: string): boolean {
  const key = `${method}:${url}:${body || ""}`
  const pending = pendingRequests.get(key)
  if (!pending) return false
  
  const age = Date.now() - pending.timestamp
  return age < REQUEST_TIMEOUT
}
