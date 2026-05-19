# Script de Deploy Automático para Glow Bela
# Este script adiciona, comita e envia as alterações para o GitHub.
# O Render detectará a mudança e atualizará o site automaticamente.

Write-Host "==> Iniciando deploy..." -ForegroundColor Cyan

$git = "C:\Program Files\Git\cmd\git.exe"

& $git add .
& $git commit -m "Atualização automática via script"
if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Nenhuma alteração para commitar ou erro no commit." -ForegroundColor Yellow
} else {
    Write-Host "==> Enviando para o GitHub..." -ForegroundColor Cyan
    & $git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "==> Deploy iniciado! O Render atualizará o site em breve." -ForegroundColor Green
    } else {
        Write-Host "==> Erro ao enviar. Verifique sua conexão ou autenticação." -ForegroundColor Red
    }
}

Write-Host "==> Concluído." -ForegroundColor Cyan
