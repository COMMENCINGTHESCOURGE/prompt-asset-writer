@REM PROMPT ASSET WRITER CI GATES (Windows batch)
@echo off
setlocal enabledelayedexpansion

set REPO=%~dp0
cd /d "%REPO%"

echo === PROMPT ASSET WRITER CI GATES ===
echo.

rem 1. BUILD: TypeScript compiles
echo --- Gate 1: TypeScript Build ---
call npx tsc --noEmit
if %errorlevel% neq 0 (
  echo FAIL: TypeScript compilation failed
  exit /b 1
)
echo PASS: TypeScript compiles
echo.

rem 2. TEST: vitest passes
echo --- Gate 2: Tests ---
call npx vitest run --passWithNoTests
if %errorlevel% neq 0 (
  echo FAIL: Tests failed
  exit /b 1
)
echo PASS: All tests pass
echo.

rem 3. TEMPLATE REGISTRY
echo --- Gate 3: Template Registry ---
if not exist "templates\template-metadata.json" (
  echo FAIL: template-metadata.json not found
  exit /b 1
)
for %%f in (templates\*.hbs) do (
  findstr /C:"%%~nxf" templates\template-metadata.json >nul
  if !errorlevel! neq 0 (
    echo FAIL: %%~nxf missing from template-metadata.json
    exit /b 1
  )
)
echo PASS: All templates registered in metadata
echo.

rem 4. DIST
echo --- Gate 4: Compiled Output ---
if not exist "dist\cli.js" (
  echo FAIL: dist/cli.js not found
  exit /b 1
)
echo PASS: dist/cli.js present
echo.

rem 5. CLI SMOKE
echo --- Gate 5: CLI Smoke Test ---
node dist/cli.js --version >nul 2>&1
if %errorlevel% neq 0 (
  echo FAIL: --version failed
  exit /b 1
)
node dist/cli.js --help >nul 2>&1
if %errorlevel% neq 0 (
  echo FAIL: --help failed
  exit /b 1
)
node dist/cli.js list >nul 2>&1
if %errorlevel% neq 0 (
  echo FAIL: list failed
  exit /b 1
)
echo PASS: CLI responds
echo.

rem 6. VINCULUM ANALYSIS
echo --- Gate 6: Vinculum Analysis ---
for %%f in (templates\*.hbs) do (
  node dist/cli.js analyze -t "%%~nxf" | findstr "Central Vinculum" >nul
  if !errorlevel! neq 0 (
    echo FAIL: analyze %%~nxf did not produce vinculum report
    exit /b 1
  )
)
echo PASS: All templates produce vinculum analysis
echo.

rem 7. GENERATE SMOKE
echo --- Gate 7: Generate Smoke Test ---
echo {"title":"GateTest","phase":"ci","author":"ACCEPTANCE","purpose":"testing gates","requirements":["x"],"acceptance":["y"]} > "%TEMP%\paw-test-data.json"
node dist/cli.js generate -t prompt.md.hbs -o "%TEMP%\paw-test-output.md" -d @%TEMP%\paw-test-data.json >nul 2>&1
set GENRESULT=%errorlevel%
if %GENRESULT% equ 0 (
  if exist "%TEMP%\paw-test-output.md" (
    echo PASS: generate produces valid output
  ) else (
    echo FAIL: generate did not produce output file
    set GENRESULT=1
  )
) else (
  echo FAIL: generate command failed
)
del "%TEMP%\paw-test-output.md" >nul 2>&1
del "%TEMP%\paw-test-data.json" >nul 2>&1
if %GENRESULT% neq 0 exit /b %GENRESULT%
echo.

echo === ALL GATES PASSED ===
