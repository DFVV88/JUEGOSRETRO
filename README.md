# JUEGOSRETRO — Ignition en Chrome

Proyecto para ejecutar **Ignition (Win32, 32-bit)** dentro de Google Chrome usando **BoxedWine/Wine compilado a WebAssembly**.

## Objetivo

Abrir una URL en Chrome y arrancar el juego sin tener que subir manualmente un ZIP ni seleccionar el ejecutable cada vez.

Flujo deseado:

```
Chrome
  ↓
BoxedWine WebAssembly
  ↓
Wine
  ↓
Ign_d3d.exe
```

## Estado

- [x] Repo preparado
- [x] Estrategia definida: BoxedWine Web/WASM
- [x] Ejecutable recomendado: `Ign_d3d.exe`
- [ ] Integrar runtime web de BoxedWine 26R1
- [ ] Integrar archivos del juego
- [ ] Arrancar Ignition automáticamente
- [ ] Validar DirectDraw
- [ ] Validar audio
- [ ] Validar teclado
- [ ] Pantalla completa
- [ ] Publicación web

## Importante

Los binarios del juego **no deben publicarse en un repositorio público**. El código del launcher y la integración sí pueden mantenerse en GitHub.

La versión web de BoxedWine no tiene aceleración 3D completa; por eso priorizamos DirectDraw y `Ign_d3d.exe` sobre `Ign_3dfx.exe`.

## Runtime

Se usará BoxedWine 26R1 Web desde su release oficial. GitHub Actions descargará el runtime automáticamente durante el build para evitar guardar más de 100 MB de binarios de terceros en este repo.
