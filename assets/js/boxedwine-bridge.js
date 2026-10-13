(function(){
  "use strict";

  const DB_NAME="juegosretro-assets";
  const DB_VERSION=1;
  const STORE="files";
  const GAME_KEY="ignition.zip";
  const originalFetch=window.fetch.bind(window);

  function openDb(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
  }

  async function getGame(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readonly");
      const req=tx.objectStore(STORE).get(GAME_KEY);
      req.onsuccess=()=>resolve(req.result || null);
      req.onerror=()=>reject(req.error);
    });
  }

  window.fetch=async function(input,init){
    let raw="";
    try{
      raw=typeof input==="string" ? input : (input && input.url ? input.url : String(input));
      const url=new URL(raw,location.href);
      const filename=url.pathname.split("/").pop().toLowerCase();

      if(filename==="ignition.zip"){
        const record=await getGame();
        if(record && record.blob instanceof Blob){
          console.log("[JUEGOS RETRO] Sirviendo ignition.zip desde IndexedDB local");
          return new Response(record.blob,{
            status:200,
            statusText:"OK",
            headers:{
              "Content-Type":"application/zip",
              "Content-Length":String(record.blob.size),
              "Cache-Control":"no-store"
            }
          });
        }
        console.error("[JUEGOS RETRO] ignition.zip no está guardado localmente");
        return new Response("Ignition local asset missing",{status:404});
      }
    }catch(error){
      console.warn("[JUEGOS RETRO] Bridge fetch fallback:",error);
    }
    return originalFetch(input,init);
  };

  function enhanceBoxedWineControls(){
    const pointerLock=document.getElementById("pointerLock");
    const showConsole=document.getElementById("showConsole");
    const resize=document.getElementById("resize");

    if(!pointerLock || !showConsole || !resize) return;

    const nativeRow=pointerLock.parentElement;
    if(!nativeRow || document.getElementById("jr-runtime-controls")) return;

    // Sensible defaults for Ignition: keyboard game, clean viewport, original aspect ratio.
    pointerLock.checked=false;
    showConsole.checked=false;
    resize.checked=false;

    const output=document.getElementById("output");
    if(output) output.style.display="none";

    nativeRow.style.display="none";

    const bar=document.createElement("div");
    bar.id="jr-runtime-controls";
    bar.innerHTML = `
      <div class="jr-runtime-left">
        <span class="jr-runtime-badge">IGNITION</span>
        <span class="jr-runtime-note">BoxedWine · cnc-ddraw</span>
      </div>
      <div class="jr-runtime-options">
        <label title="No es necesario para Ignition; sirve para juegos que usan el mouse.">
          <input id="jr-pointer" type="checkbox"> Capturar mouse
        </label>
        <label title="Muestra los mensajes técnicos de BoxedWine debajo del juego.">
          <input id="jr-console" type="checkbox"> Consola técnica
        </label>
        <label title="Permite que el canvas cambie de tamaño al entrar en pantalla completa.">
          <input id="jr-resize" type="checkbox"> Ajustar pantalla
        </label>
        <button id="jr-fullscreen" type="button">Pantalla completa</button>
      </div>
    `;

    nativeRow.insertAdjacentElement("afterend",bar);

    const jrPointer=bar.querySelector("#jr-pointer");
    const jrConsole=bar.querySelector("#jr-console");
    const jrResize=bar.querySelector("#jr-resize");
    const jrFullscreen=bar.querySelector("#jr-fullscreen");

    jrPointer.addEventListener("change",()=>{
      pointerLock.checked=jrPointer.checked;
    });

    jrConsole.addEventListener("change",()=>{
      showConsole.checked=jrConsole.checked;
      if(typeof window.toggleConsole==="function") window.toggleConsole();
      else if(output) output.style.display=jrConsole.checked ? "block" : "none";
    });

    jrResize.addEventListener("change",()=>{
      resize.checked=jrResize.checked;
    });

    jrFullscreen.addEventListener("click",()=>{
      if(window.Module && typeof window.Module.requestFullscreen==="function"){
        window.Module.requestFullscreen(pointerLock.checked,resize.checked);
      }
    });

    const style=document.createElement("style");
    style.textContent=`
      body{margin:0;background:#02040a;color:#dce7ff;font-family:Arial,sans-serif}
      #jr-runtime-controls{
        min-height:54px;display:flex;align-items:center;justify-content:space-between;
        gap:18px;padding:8px 14px;background:linear-gradient(90deg,#07101d,#0b1027);
        border-bottom:1px solid rgba(90,226,255,.18);box-sizing:border-box
      }
      .jr-runtime-left{display:flex;align-items:center;gap:10px;min-width:max-content}
      .jr-runtime-badge{font-weight:800;font-size:11px;letter-spacing:.12em;color:#2df7ff}
      .jr-runtime-note{font-size:11px;color:#7385ad}
      .jr-runtime-options{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}
      .jr-runtime-options label{display:flex;align-items:center;gap:6px;font-size:11px;color:#aebbd9;cursor:pointer;white-space:nowrap}
      .jr-runtime-options input{accent-color:#2df7ff}
      #jr-fullscreen{border:1px solid rgba(45,247,255,.28);background:rgba(45,247,255,.08);
        color:#eafcff;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
      #jr-fullscreen:hover{background:rgba(45,247,255,.14)}
      #dropzone{background:#000}
      @media(max-width:720px){
        #jr-runtime-controls{align-items:flex-start;flex-direction:column}
        .jr-runtime-options{justify-content:flex-start}
      }
    `;
    document.head.appendChild(style);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",enhanceBoxedWineControls,{once:true});
  }else{
    enhanceBoxedWineControls();
  }

  console.log("[JUEGOS RETRO] BoxedWine local-asset bridge activo");
})();
