from fastapi import Request, HTTPException
import time
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """Simple in-memory rate limiter for critical endpoints."""
    
    def __init__(self):
        self.requests = defaultdict(list)  # {key: [timestamps]}
        self.cleanup_interval = 60  # Cleanup every 60 seconds
        self.last_cleanup = time.time()
    
    def _cleanup(self):
        """Remove old timestamps to prevent memory leak."""
        now = time.time()
        if now - self.last_cleanup > self.cleanup_interval:
            current_time = now
            for key in list(self.requests.keys()):
                # Keep only requests from last 60 seconds
                self.requests[key] = [
                    ts for ts in self.requests[key] 
                    if current_time - ts < 60
                ]
                if not self.requests[key]:
                    del self.requests[key]
            self.last_cleanup = now
    
    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request is allowed under rate limit."""
        self._cleanup()
        
        now = time.time()
        cutoff = now - window_seconds
        
        # Remove old requests outside the window
        self.requests[key] = [ts for ts in self.requests[key] if ts > cutoff]
        
        if len(self.requests[key]) < max_requests:
            self.requests[key].append(now)
            return True
        
        return False
    
    def get_reset_time(self, key: str, window_seconds: int) -> int:
        """Get seconds until rate limit resets."""
        if not self.requests[key]:
            return 0
        oldest = min(self.requests[key])
        reset = oldest + window_seconds
        return max(0, int(reset - time.time()))

# Global rate limiter instance
rate_limiter = RateLimiter()

class RequestMetrics:
    """Track request latency and errors for monitoring."""
    
    def __init__(self):
        self.request_times = defaultdict(list)  # {endpoint: [latencies]}
        self.error_counts = defaultdict(int)
        self.max_samples = 100
    
    def record_request(self, endpoint: str, latency_ms: float):
        """Record request latency."""
        times = self.request_times[endpoint]
        times.append(latency_ms)
        if len(times) > self.max_samples:
            times.pop(0)
    
    def record_error(self, endpoint: str):
        """Record error for this endpoint."""
        self.error_counts[endpoint] += 1
    
    def get_stats(self, endpoint: str):
        """Get average latency and error rate."""
        times = self.request_times[endpoint]
        if not times:
            return {
                "avg_latency_ms": 0,
                "max_latency_ms": 0,
                "min_latency_ms": 0,
                "error_count": self.error_counts[endpoint]
            }
        
        return {
            "avg_latency_ms": round(sum(times) / len(times), 2),
            "max_latency_ms": max(times),
            "min_latency_ms": min(times),
            "error_count": self.error_counts[endpoint],
            "sample_count": len(times)
        }

# Global metrics instance
metrics = RequestMetrics()

async def rate_limit_middleware(request: Request, call_next):
    """Middleware to enforce rate limiting on critical endpoints."""
    
    # Only rate limit login endpoint
    if request.url.path == "/login" and request.method == "POST":
        # Rate limit by IP + endpoint (5 requests per minute)
        client_ip = request.client.host if request.client else "unknown"
        rate_key = f"{client_ip}:/login"
        
        if not rate_limiter.is_allowed(rate_key, max_requests=5, window_seconds=60):
            reset_in = rate_limiter.get_reset_time(rate_key, 60)
            logger.warning(f"Rate limit exceeded for {rate_key}, reset in {reset_in}s")
            raise HTTPException(
                status_code=429,
                detail=f"Too many login attempts. Please try again in {reset_in} seconds."
            )
    
    # Track request timing
    start_time = time.time()
    try:
        response = await call_next(request)
        latency_ms = (time.time() - start_time) * 1000
        metrics.record_request(request.url.path, latency_ms)
        
        if latency_ms > 1000:  # Log slow requests
            logger.warning(f"Slow request: {request.method} {request.url.path} took {latency_ms:.0f}ms")
        
        return response
    except Exception as e:
        metrics.record_error(request.url.path)
        logger.error(f"Request error: {request.method} {request.url.path} - {str(e)}")
        raise

def require_json_content_type(request: Request):
    """Check that request has JSON content type."""
    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type:
            raise HTTPException(
                status_code=415,
                detail="Content-Type must be application/json"
            )
