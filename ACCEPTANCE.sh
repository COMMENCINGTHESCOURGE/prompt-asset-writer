#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

echo "=== PROMPT ASSET WRITER CI GATES ==="

echo ""
echo "--- Gate 1: TypeScript Build ---"
npx tsc --noEmit
echo "PASS: TypeScript compiles"

echo ""
echo "--- Gate 2: Tests ---"
npx vitest run --passWithNoTests
echo "PASS: All tests pass"

echo ""
echo "--- Gate 3: Template Registry ---"
REGISTRY="templates/template-metadata.json"
if [ ! -f "$REGISTRY" ]; then
  echo "FAIL: template-metadata.json not found"
  exit 1
fi
for tmpl in templates/*.hbs; do
  name=$(basename "$tmpl")
  if ! grep -q "\"$name\"" "$REGISTRY"; then
    echo "FAIL: $name missing from template-metadata.json"
    exit 1
  fi
done
echo "PASS: All templates registered in metadata"

echo ""
echo "--- Gate 4: Compiled Output ---"
if [ ! -f "dist/cli.js" ]; then
  echo "FAIL: dist/cli.js not found (run npm run build)"
  exit 1
fi
echo "PASS: dist/cli.js present"

echo ""
echo "--- Gate 5: CLI Smoke Test ---"
node dist/cli.js --version > /dev/null 2>&1 || { echo "FAIL: --version failed"; exit 1; }
node dist/cli.js --help > /dev/null 2>&1 || { echo "FAIL: --help failed"; exit 1; }
node dist/cli.js list > /dev/null 2>&1 || { echo "FAIL: list failed"; exit 1; }
echo "PASS: CLI responds"

echo ""
echo "--- Gate 6: Vinculum Analysis ---"
for tmpl in templates/*.hbs; do
  name=$(basename "$tmpl")
  output=$(node dist/cli.js analyze -t "$name" 2>&1)
  if ! echo "$output" | grep -q "Central Vinculum"; then
    echo "FAIL: analyze $name did not produce vinculum report"
    exit 1
  fi
done
echo "PASS: All templates produce vinculum analysis"

echo ""
echo "--- Gate 7: Generate Smoke Test ---"
node dist/cli.js generate \
  -t prompt.md.hbs \
  -o /tmp/paw-test-output.md \
  -d '{"title":"GateTest","phase":"ci","author":"ACCEPTANCE.sh","purpose":"testing gates","requirements":["x"],"acceptance":["y"]}' \
  > /dev/null 2>&1 || { echo "FAIL: generate command failed"; exit 1; }
if [ ! -f /tmp/paw-test-output.md ]; then
  echo "FAIL: generate did not produce output file"
  exit 1
fi
rm -f /tmp/paw-test-output.md
echo "PASS: generate produces valid output"

echo ""
echo "=== ALL GATES PASSED ==="
