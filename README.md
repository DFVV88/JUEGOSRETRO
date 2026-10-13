# JUEGOS RETRO — Play the Past

**JUEGOS RETRO** es una plataforma web futurista para ejecutar juegos retro gratuitos y legalmente distribuibles directamente en navegadores modernos.

## Visión

Queremos que el usuario haga solamente esto:

```
Entrar a JUEGOS RETRO
        ↓
Elegir un juego
        ↓
Pulsar JUGAR
        ↓
Chrome carga el motor adecuado
        ↓
A jugar
```

## Motores previstos

- **BoxedWine / Wine WebAssembly** para juegos Win32 antiguos.
- **DOSBox / js-dos** para juegos DOS.
- **WebAssembly / ports nativos** cuando exista una versión abierta.
- **HTML5/WebGL** para juegos ya preparados para navegador.

## Política de contenido

La plataforma puede ser gratuita, pero los archivos publicados deben tener distribución legal.

Aceptamos:

- open-source;
- freeware con permiso de redistribución;
- shareware que permita redistribución;
- dominio público;
- juegos cuyos titulares autoricen su distribución;
- juegos comerciales que funcionen con archivos aportados legalmente por el propio usuario.

No publicaremos ROMs ni copias comerciales sin autorización.

## Estado actual

- [x] Identidad visual futurista.
- [x] Landing page responsive.
- [x] Catálogo dinámico.
- [x] Buscador.
- [x] Filtros por plataforma.
- [x] Favoritos guardados en el navegador.
- [x] Metadatos de distribución legal.
- [ ] Publicar preview con GitHub Pages.
- [ ] Integrar primer juego open-source jugable.
- [ ] Integrar Ignition mediante archivos aportados por el usuario.
- [ ] Añadir controles, audio y pantalla completa.
- [ ] Sistema modular para nuevos juegos.

## Ignition

Ignition es el primer experimento Win32 del proyecto.

- Ejecutable objetivo: `Ign_d3d.exe`.
- Runtime: BoxedWine/Wine.
- La copia del juego **no se almacena en este repositorio público**.
- El usuario deberá aportar legalmente sus archivos del juego.

## Desarrollo

La rama activa de diseño es:

```
feat/futuristic-web
```
