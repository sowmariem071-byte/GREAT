# Requires Administrator. Enables the Windows features Docker Desktop needs.
$ErrorActionPreference = "Stop"

Write-Host "Enabling Windows Subsystem for Linux..."
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

Write-Host "Enabling Virtual Machine Platform..."
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "Installing or updating WSL..."
wsl.exe --install --no-distribution
wsl.exe --update
wsl.exe --set-default-version 2

Write-Host ""
Write-Host "WSL setup finished. If Windows asks for a restart, restart before launching Docker Desktop again."
