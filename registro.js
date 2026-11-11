// Registro privado en Google Sheets. No contiene contraseñas ni el correo anfitrión.
(() => {
  const form=document.getElementById('f-confirmar'),actions=form.querySelector('.m-botones');
  const endpoint=String(window.CONFIG.REGISTRO_URL||'').trim();
  const validEndpoint=/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint);
  let saved='',busy=false,pendingId='';
  const quantity=document.createElement('div');quantity.className='registro-cantidad';quantity.hidden=true;
  quantity.innerHTML='<label class="m-et" for="f-personas">Cantidad de personas que asistirán</label><input id="f-personas" name="personas" type="number" inputmode="numeric" min="1" max="15" step="1" value="1"><p class="m-nota">Incluyéndote a ti. Máximo 15 personas.</p>';
  form.insertBefore(quantity,form.querySelector('.m-error'));
  const trap=document.createElement('input');trap.name='website';trap.tabIndex=-1;trap.autocomplete='off';trap.className='registro-trampa';trap.setAttribute('aria-hidden','true');form.append(trap);
  const button=document.createElement('button');button.type='submit';button.className='registro-guardar';button.textContent='Confirmar y guardar respuesta';
  const status=document.createElement('p');status.className='registro-estado';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const fallback=document.createElement('a');fallback.className='registro-alternativo';fallback.target='_blank';fallback.rel='noopener';fallback.textContent='Abrir formulario de Google';fallback.hidden=true;
  form.insertBefore(button,actions);form.insertBefore(status,actions);form.insertBefore(fallback,actions);
  const note=form.querySelector(':scope > .m-nota');
  function data(){return {nombre:form.elements.nombre.value.trim().replace(/\s+/g,' '),asiste:form.elements.asiste.value,personas:form.elements.asiste.value==='si'?Number(form.elements.personas.value):0,website:trap.value};}
  function signature(d){return JSON.stringify([d.nombre,d.asiste,d.personas]);}
  function idFor(d){
    const key='santiago-registro:'+location.pathname+':'+d.nombre.toLocaleLowerCase('es-CL');
    try{let id=localStorage.getItem(key);if(!/^[a-f0-9-]{36}$/i.test(id||'')){id=crypto.randomUUID();localStorage.setItem(key,id);}return id;}
    catch{if(!pendingId)pendingId=crypto.randomUUID();return pendingId;}
  }
  function update(){
    const d=data();quantity.hidden=d.asiste!=='si';const ok=saved===signature(d);actions.hidden=!ok;
    note.textContent=ok?'Tu respuesta ya está registrada. Si quieres, también puedes avisar por WhatsApp. Recuerda pulsar «Enviar» allí.':'Primero guarda tu respuesta para aparecer en el listado. Después podrás avisar por WhatsApp a Marcia o Ángel.';
    button.textContent=ok?'Respuesta guardada ✓':'Confirmar y guardar respuesta';button.disabled=busy||ok;
    if(!ok&&!busy){status.textContent='';fallback.hidden=true;}
  }
  window.RegistroAsistencia={isSaved:()=>saved===signature(data()),people:()=>data().personas};
  form.addEventListener('input',update);form.addEventListener('change',update);
  function lock(value){busy=value;form.querySelectorAll('input,button').forEach(el=>{el.disabled=value;});}
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;const d=data();
    if(d.nombre.length<2){status.textContent='Escribe tu nombre, por favor.';form.elements.nombre.focus();return;}
    if(!['si','no'].includes(d.asiste)){status.textContent='Cuéntanos si podrás acompañarnos.';return;}
    if(d.asiste==='si'&&(!Number.isInteger(d.personas)||d.personas<1||d.personas>15)){status.textContent='Indica entre 1 y 15 personas, incluyéndote.';return;}
    if(!validEndpoint){status.textContent='El registro todavía no está habilitado. Los anfitriones deben conectar Google antes de compartir esta versión.';return;}
    d.id=idFor(d);fallback.href=endpoint+'?id='+encodeURIComponent(d.id);fallback.hidden=true;
    lock(true);status.textContent='Guardando tu respuesta…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
    try{
      const response=await fetch(endpoint,{method:'POST',body:new URLSearchParams(d),signal:controller.signal,redirect:'follow',credentials:'omit'});
      if(!response.ok)throw new Error('No se pudo conectar con Google.');
      const result=await response.json();
      if(result.ok!==true||result.id!==d.id)throw new Error(result.message||'No pudimos verificar el registro.');
      saved=signature(d);lock(false);update();status.textContent='¡Tu respuesta quedó guardada! Muchas gracias.';
    }catch(error){
      lock(false);update();status.textContent='No pudimos comprobar que se guardó tu respuesta. Puedes reintentar sin duplicarla o abrir el formulario de Google.';fallback.hidden=false;
    }finally{clearTimeout(timer);}
  });
  update();
})();
