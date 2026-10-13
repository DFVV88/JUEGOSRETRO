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

  console.log("[JUEGOS RETRO] BoxedWine local-asset bridge activo");
})();
