#!/usr/bin/env python3
"""
Production Readiness Validator for AttendX
Checks all critical configurations before deployment
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Tuple, List

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def check(condition: bool, message: str) -> Tuple[bool, str]:
    """Return check result."""
    symbol = f"{Colors.GREEN}✓{Colors.RESET}" if condition else f"{Colors.RED}✗{Colors.RESET}"
    status = "PASS" if condition else "FAIL"
    return condition, f"{symbol} {message:<50} [{status}]"

def section(title: str) -> str:
    """Format section header."""
    return f"\n{Colors.BLUE}{'='*60}{Colors.RESET}\n{Colors.BLUE}{title}{Colors.RESET}\n{Colors.BLUE}{'='*60}{Colors.RESET}"

def main():
    print(f"{Colors.BLUE}AttendX Production Readiness Check{Colors.RESET}")
    
    results: List[bool] = []
    
    # 1. Backend Checks
    print(section("Backend Configuration"))
    
    # Check if backend directory exists
    backend_path = Path("backend")
    exists, msg = check(backend_path.exists(), "Backend directory exists")
    results.append(exists)
    print(msg)
    
    # Check main.py
    main_py = backend_path / "main.py"
    exists, msg = check(main_py.exists(), "main.py exists")
    results.append(exists)
    print(msg)
    
    # Check for rate limiter
    rate_limiter = backend_path / "rate_limiter.py"
    exists, msg = check(rate_limiter.exists(), "rate_limiter.py implemented")
    results.append(exists)
    print(msg)
    
    # Check main.py has health endpoint
    if main_py.exists():
        main_content = main_py.read_text()
        has_health = "/health" in main_content and "def healthcheck" in main_content
        exists, msg = check(has_health, "Health endpoint implemented")
        results.append(exists)
        print(msg)
        
        has_metrics = "/metrics" in main_content
        exists, msg = check(has_metrics, "Metrics endpoint implemented")
        results.append(exists)
        print(msg)
        
        has_startup = "@app.on_event" in main_content and "warm_database" in main_content
        exists, msg = check(has_startup, "Database warm-up on startup")
        results.append(exists)
        print(msg)
        
        has_logging = "import logging" in main_content
        exists, msg = check(has_logging, "Logging configured")
        results.append(exists)
        print(msg)
    
    # Check requirements.txt
    requirements = backend_path / "requirements.txt"
    exists, msg = check(requirements.exists(), "requirements.txt exists")
    results.append(exists)
    print(msg)
    
    # 2. Frontend Checks
    print(section("Frontend Configuration"))
    
    src_path = Path("src")
    exists, msg = check(src_path.exists(), "src directory exists")
    results.append(exists)
    print(msg)
    
    # Check for api-client
    api_client = src_path / "lib" / "api-client.ts"
    exists, msg = check(api_client.exists(), "API client with retry logic")
    results.append(exists)
    print(msg)
    
    # Check for app.tsx warm-up
    app_tsx = src_path / "App.tsx"
    if app_tsx.exists():
        app_content = app_tsx.read_text()
        has_warmup = "fetch" in app_content and "localhost" in app_content or "VITE_API_URL" in app_content
        exists, msg = check(has_warmup, "Backend warm-up on app load")
        results.append(exists)
        print(msg)
    
    # Check Login component uses retry client
    login_tsx = src_path / "pages" / "Login.tsx"
    if login_tsx.exists():
        login_content = login_tsx.read_text()
        uses_retry = "apiCall" in login_content or "fetchWithRetry" in login_content
        exists, msg = check(uses_retry, "Login uses retry client")
        results.append(exists)
        print(msg)
    
    # 3. Configuration Files
    print(section("Configuration Files"))
    
    # Check render.yaml
    render_yaml = Path("render.yaml")
    if render_yaml.exists():
        render_content = render_yaml.read_text()
        has_pool_config = "SQLALCHEMY_POOL" in render_content
        exists, msg = check(has_pool_config, "Render has pool configuration")
        results.append(exists)
        print(msg)
        
        has_workers = "workers" in render_content
        exists, msg = check(has_workers, "Render configured for multiple workers")
        results.append(exists)
        print(msg)
    
    # Check .env.production
    env_prod = backend_path / ".env.production"
    if env_prod.exists():
        env_content = env_prod.read_text()
        has_db_url = "DATABASE_URL" in env_content
        exists, msg = check(has_db_url, ".env.production has DATABASE_URL")
        results.append(exists)
        print(msg)
        
        has_pool_settings = "SQLALCHEMY_POOL_SIZE" in env_content
        exists, msg = check(has_pool_settings, ".env.production has pool settings")
        results.append(exists)
        print(msg)
    
    # 4. Documentation
    print(section("Documentation"))
    
    docs_required = [
        ("PRODUCTION_SETUP.md", "Setup guide"),
        ("PRODUCTION_DEPLOYMENT.md", "Deployment checklist"),
        ("PRODUCTION_TROUBLESHOOTING.md", "Troubleshooting guide"),
        ("PRODUCTION_READY.md", "Readiness summary"),
    ]
    
    for doc, desc in docs_required:
        doc_path = Path(doc)
        exists, msg = check(doc_path.exists(), f"{desc} ({doc})")
        results.append(exists)
        print(msg)
    
    # 5. Git Configuration
    print(section("Git Configuration"))
    
    gitignore = Path(".gitignore")
    if gitignore.exists():
        gitignore_content = gitignore.read_text()
        ignores_env = ".env" in gitignore_content
        exists, msg = check(ignores_env, ".env files ignored")
        results.append(exists)
        print(msg)
    
    # 6. Summary
    print(section("Summary"))
    
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"Checks Passed: {passed}/{total} ({percentage:.1f}%)")
    
    if percentage == 100:
        print(f"{Colors.GREEN}✓ All checks passed! System is production-ready.{Colors.RESET}")
        return 0
    elif percentage >= 90:
        print(f"{Colors.YELLOW}⚠ Most checks passed, but some items need attention.{Colors.RESET}")
        return 1
    else:
        print(f"{Colors.RED}✗ Multiple critical items need attention before production.{Colors.RESET}")
        return 2

if __name__ == "__main__":
    sys.exit(main())
