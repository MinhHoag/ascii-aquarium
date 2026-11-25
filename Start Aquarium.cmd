@echo off
setlocal
cd /d "%~dp0"
set PIXEL_REEF_OPEN_BROWSER=1
dotnet build -p:NuGetAudit=false
if errorlevel 1 (
  echo Starting local demo. Bluetooth requires the Windows SDK reference package.
  dotnet build -p:TankDemo=true -p:NuGetAudit=false || exit /b 1
  dotnet "bin\Debug\net8.0\Aquarium.dll"
) else (
  dotnet "bin\Debug\net8.0-windows10.0.19041.0\Aquarium.dll"
)
pause
