const DB_NAME = "juegosretro-assets";
const DB_VERSION = 1;
const STORE = "files";
const GAME_KEY = "ignition.zip";

const gameFile = document.querySelector("#gameFile");
const chooseFile = document.querySelector("#chooseFile");
const changeFile = document.querySelector("#changeFile");
const removeFile = document.querySelector("#removeFile");
const launchGame = document.querySelector("#launchGame");
const fileStatus = document.querySelector("#fileStatus");
const runtimeStatus = document.querySelector("#runtimeStatus");
const runtimeLight = document.querySelector("#runtimeLight");
const gameFrame = document.querySelector("#gameFrame");
const stagePlaceholder = document.querySelector("#stagePlaceholder");
const fullscreenGame = document.querySelector("#fullscreenGame");
const diagnosticText = document.querySelector("#diagnosticText");
const storageStatus = document.querySelector("#storageStatus");

let gameReady = false;
let runtimeReady = false;

async function refreshStorageStatus(requestPersist = false){
  if(!navigator.storage){
    if(storageStatus) storageStatus.textContent = "Almacenamiento local disponible; modo persistente no compatible.";
    return false;
  }

  try{
    let persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;

    if(requestPersist && !persisted && navigator.storage.persist){
      persisted = await navigator.storage.persist();
    }

    let estimateText = "";
    if(navigator.storage.estimate){
      const estimate = await navigator.storage.estimate();
      if(estimate.usage != null){
        estimateText = ` · uso local ${formatBytes(estimate.usage)}`;
      }
    }

    if(storageStatus){
      storageStatus.textContent = persisted
        ? `✓ Chrome protegió el archivo contra limpieza automática${estimateText}`
        : `Guardado en Chrome${estimateText}. Evita incógnito y no borres los datos del sitio.`;
      storageStatus.className = persisted ? "storage-status ready" : "storage-status";
    }
    return persisted;
  }catch(error){
    if(storageStatus){
      storageStatus.textContent = "El ZIP seguirá guardado en Chrome mientras no borres los datos del sitio.";
    }
    return false;
  }
}

function openDb(){
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(key){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,"readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key,value){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,"readwrite");
    tx.objectStore(STORE).put(value,key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(key){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(STORE,"readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function formatBytes(bytes){
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes/1024)} KB`;
}

async function zipContains(file, target){
  const tailSize = Math.min(file.size, 0x10000 + 22);
  const tailOffset = file.size - tailSize;
  const tail = new Uint8Array(await file.slice(tailOffset).arrayBuffer());
  let eocd = -1;

  for(let i=tail.length-22;i>=0;i--){
    if(tail[i]===0x50 && tail[i+1]===0x4b && tail[i+2]===0x05 && tail[i+3]===0x06){
      eocd=i; break;
    }
  }
  if(eocd < 0) return false;

  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const entries = view.getUint16(eocd+10,true);
  const cdSize = view.getUint32(eocd+12,true);
  const cdOffset = view.getUint32(eocd+16,true);

  if(cdSize <= 0 || cdOffset + cdSize > file.size) return false;

  const cd = new Uint8Array(await file.slice(cdOffset, cdOffset+cdSize).arrayBuffer());
  const cdView = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  let offset=0;
  const decoder = new TextDecoder("utf-8");

  for(let n=0;n<entries && offset+46<=cd.length;n++){
    if(cdView.getUint32(offset,true)!==0x02014b50) break;
    const nameLength = cdView.getUint16(offset+28,true);
    const extraLength = cdView.getUint16(offset+30,true);
    const commentLength = cdView.getUint16(offset+32,true);
    const name = decoder.decode(cd.subarray(offset+46, offset+46+nameLength));
    if(name.replace(/\\/g,"/").toLowerCase().endsWith(target.toLowerCase())) return true;
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return false;
}

function updateLaunchState(){
  launchGame.disabled = !(gameReady && runtimeReady);
}

async function inspectStoredGame(){
  try{
    const record = await dbGet(GAME_KEY);
    if(record && record.blob instanceof Blob){
      gameReady = true;
      fileStatus.textContent = `✓ Ignition guardado localmente · ${record.name || "ignition.zip"} · ${formatBytes(record.blob.size)}`;
      fileStatus.className = "ready";
      chooseFile.textContent = "Reemplazar ZIP";
      diagnosticText.textContent = `Archivo local: ${record.name || "ignition.zip"} (${formatBytes(record.blob.size)}). No necesitas seleccionarlo nuevamente en este mismo Chrome.`;
    }else{
      gameReady = false;
      fileStatus.textContent = "No hay un ZIP de Ignition guardado en este navegador.";
      fileStatus.className = "";
    }
  }catch(error){
    gameReady = false;
    fileStatus.textContent = "Chrome no permitió leer el almacenamiento local: " + error.message;
    fileStatus.className = "error";
  }
  updateLaunchState();
}

async function checkRuntime(){
  try{
    const response = await fetch("../runtime/boxedwine/boxedwine.html", {method:"HEAD", cache:"no-store"});
    if(!response.ok) throw new Error("HTTP " + response.status);
    runtimeReady = true;
    runtimeStatus.textContent = "BoxedWine 26R1 listo";
    runtimeLight.className = "runtime-light ready";
  }catch(error){
    runtimeReady = false;
    runtimeStatus.textContent = "Runtime aún no disponible";
    runtimeLight.className = "runtime-light error";
    diagnosticText.textContent = "El despliegue de BoxedWine todavía no está disponible: " + error.message;
  }
  updateLaunchState();
}

async function handleFile(file){
  fileStatus.textContent = "Validando el ZIP…";
  fileStatus.className = "";

  if(!file || !file.name.toLowerCase().endsWith(".zip")){
    throw new Error("Selecciona un archivo .zip.");
  }
  if(file.size < 1024 * 1024){
    throw new Error("El archivo es demasiado pequeño para ser Ignition.");
  }

  const hasExe = await zipContains(file, "Ign_d3d.exe");
  if(!hasExe){
    throw new Error("No encuentro Ign_d3d.exe dentro del ZIP.");
  }

  await dbPut(GAME_KEY,{
    blob:file,
    name:file.name,
    size:file.size,
    updatedAt:Date.now()
  });

  await inspectStoredGame();
  await refreshStorageStatus(true);
}

chooseFile.addEventListener("click",()=>gameFile.click());
changeFile.addEventListener("click",()=>gameFile.click());

gameFile.addEventListener("change", async()=>{
  const [file] = gameFile.files;
  if(!file) return;
  try{
    await handleFile(file);
  }catch(error){
    gameReady=false;
    fileStatus.textContent = "✕ " + error.message;
    fileStatus.className = "error";
    updateLaunchState();
  }finally{
    gameFile.value="";
  }
});

removeFile.addEventListener("click", async()=>{
  await dbDelete(GAME_KEY);
  gameFrame.src="about:blank";
  gameFrame.hidden=true;
  stagePlaceholder.hidden=false;
  fullscreenGame.disabled=true;
  await inspectStoredGame();
  await refreshStorageStatus(false);
});

launchGame.addEventListener("click", ()=>{
  if(!gameReady || !runtimeReady) return;

  const params = new URLSearchParams({
    app:"ignition",
    p:"Ign_d3d.exe",
    storage:"memory",
    resolution:"640x480",
    sound:"true",
    audioFreq:"22050",
    bpp:"16",
    storageKey:"ignition"
  });

  // BoxedWine includes cnc-ddraw specifically for legacy DirectDraw games.
  // Point the override at Ignition's mounted working directory so BoxedWine
  // injects its ddraw.dll + ddraw.ini there. Keep WinMM built-in for now to
  // avoid the repack's modern VCRUNTIME dependency.
  const appDir = "/home/username/.wine/dosdevices/c:/files";
  const runtimeUrl =
    `../runtime/boxedwine/boxedwine.html?${params.toString()}` +
    `&ddrawOverride=%22${appDir}%22` +
    `&env=%22WINEDLLOVERRIDES:winmm=b%22`;

  stagePlaceholder.hidden=true;
  gameFrame.hidden=false;
  gameFrame.src=runtimeUrl;
  fullscreenGame.disabled=false;
  runtimeStatus.textContent="Iniciando Ignition…";
});

gameFrame.addEventListener("load", ()=>{
  if(gameFrame.src && !gameFrame.src.endsWith("about:blank")){
    runtimeStatus.textContent="Ignition cargado en BoxedWine";
    runtimeLight.className="runtime-light ready";

    const focusInsideGame=()=>{
      try{
        gameFrame.focus();
        const win=gameFrame.contentWindow;
        const doc=gameFrame.contentDocument;
        if(win) win.focus();
        const canvas=doc && doc.getElementById("canvas");
        if(canvas){
          canvas.tabIndex=0;
          canvas.focus({preventScroll:true});
        }
      }catch(_){}
    };

    setTimeout(focusInsideGame,1200);
    setTimeout(focusInsideGame,3000);
  }
});


function dispatchGameKey(type, code, key, keyCode){
  try{
    const win=gameFrame.contentWindow;
    if(!win) return false;

    const event=new win.KeyboardEvent(type,{
      code,
      key,
      bubbles:true,
      cancelable:true
    });

    try{
      Object.defineProperty(event,"keyCode",{get:()=>Number(keyCode)});
      Object.defineProperty(event,"which",{get:()=>Number(keyCode)});
    }catch(_){}

    win.dispatchEvent(event);

    const dot=document.querySelector("#inputTestDot");
    const status=document.querySelector("#inputTestStatus");
    if(dot) dot.classList.add("active");
    if(status) status.textContent=`Enviado: ${code}`;

    return true;
  }catch(error){
    const status=document.querySelector("#inputTestStatus");
    if(status) status.textContent="No se pudo enviar la tecla: "+error.message;
    return false;
  }
}

function bindQuickControls(){
  document.querySelectorAll(".qkey").forEach(button=>{
    const code=button.dataset.code;
    const key=button.dataset.key;
    const keyCode=button.dataset.keycode;
    let down=false;

    const press=(event)=>{
      event.preventDefault();
      if(down) return;
      down=true;
      button.classList.add("pressed");
      dispatchGameKey("keydown",code,key,keyCode);
    };

    const release=(event)=>{
      if(event) event.preventDefault();
      if(!down) return;
      down=false;
      button.classList.remove("pressed");
      dispatchGameKey("keyup",code,key,keyCode);
    };

    button.addEventListener("pointerdown",press);
    button.addEventListener("pointerup",release);
    button.addEventListener("pointercancel",release);
    button.addEventListener("pointerleave",release);
  });
}

bindQuickControls();

fullscreenGame.addEventListener("click", async()=>{
  try{
    const childWindow = gameFrame.contentWindow;
    const childModule = childWindow && childWindow.Module;

    // Prefer BoxedWine's own fullscreen path with resize enabled.
    // This scales 640x480 to the largest 4:3 image that fits the display.
    if(childModule && typeof childModule.requestFullscreen === "function"){
      childModule.requestFullscreen(false, true);
      return;
    }

    // Fallback while the runtime is still initializing.
    if(gameFrame.requestFullscreen){
      await gameFrame.requestFullscreen();
    }
  }catch(error){
    diagnosticText.textContent = "No se pudo activar pantalla completa: " + error.message;
  }
});

await Promise.all([inspectStoredGame(), checkRuntime(), refreshStorageStatus(false)]);
