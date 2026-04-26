# rules

when needing a headless browser to test use python's playwright. The binary playwright is in the path.

python3 - <<'PY'
  │ from playwright.sync_api import sync_playwright
  │
  │ … +12 lines
  └ Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    ModuleNotFoundError: No module named 'playwright'

this should not happen. just use ~/.pyenv/shims/playwright

no need to build
no need to write a summary
just change the code and reply "----------> DONE"
