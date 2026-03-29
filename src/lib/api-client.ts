// API request utility with retry logic for production reliability

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 10000;

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Make an API request with retry logic, timeout, and exponential backoff
 * Useful for handling transient Supabase/Render connection issues
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  const backoffUrl = new URL(url);
  backoffUrl.searchParams.set("_retry", "true"); // Bust cache on retry

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't retry 4xx errors (except 429 - rate limited)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new APIError(
          `HTTP ${response.status}`,
          response.status,
          false
        );
      }

      // Retry 5xx and 429 errors
      if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
        lastError = new APIError(
          `HTTP ${response.status} - retrying...`,
          response.status,
          true
        );
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry if it's a client error or abort
      if (lastError.name === "AbortError") {
        throw new APIError("Request timeout", 408, true);
      }

      // Retry network errors on subsequent attempts
      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries failed
  throw lastError || new APIError("Unknown error", 0, false);
}

/**
 * Make a JSON API request with error handling
 */
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new APIError(
      error || `HTTP ${response.status}`,
      response.status,
      response.status >= 500 || response.status === 429
    );
  }

  return response.json();
}
