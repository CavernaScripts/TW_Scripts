javascript:(function(){
  const ID='tw_con_ally_filter_box';
  if(document.getElementById(ID)){document.getElementById(ID).remove(); return;}

  // tenta descobrir qual parâmetro a página usa (con= / continent= etc) olhando os links
  function detectParam(){
    const a=[...document.querySelectorAll('a[href]')].map(x=>x.getAttribute('href')).filter(Boolean);
    const candidates=['con','continent','cont','k'];
    for(const href of a){
      for(const key of candidates){
        const re=new RegExp('[?&]'+key+'=(\\d{1,2})','i');
        if(re.test(href)) return key;
      }
    }
    // fallback: se não achar, usa "con"
    return 'con';
  }

  const param=detectParam();
  const current=new URL(location.href);
  const currentVal=current.searchParams.get(param) || '';

  // container
  const box=document.createElement('div');
  box.id=ID;
  box.style.cssText='margin:8px 0;padding:10px;border:1px solid #c9b38c;background:#f7f1e6;border-radius:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
  box.innerHTML=`
    <b style="margin-right:6px;">Filtro de Continente (Tribo)</b>
    <span>Parâmetro detectado: <code>${param}</code></span>
  `;

  const sel=document.createElement('select');
  sel.style.cssText='padding:4px 6px;';
  const optAny=document.createElement('option');
  optAny.value='';
  optAny.textContent='(atual / sem trocar)';
  sel.appendChild(optAny);

  for(let i=0;i<=99;i++){
    const v=String(i).padStart(2,'0');
    const o=document.createElement('option');
    o.value=v;
    o.textContent='C'+v;
    if(currentVal && String(currentVal).padStart(2,'0')===v) o.selected=true;
    sel.appendChild(o);
  }

  const btn=document.createElement('button');
  btn.className='btn';
  btn.textContent='Ir';
  btn.style.cssText='padding:4px 10px;cursor:pointer;';

  const btnRemove=document.createElement('button');
  btnRemove.className='btn';
  btnRemove.textContent='Remover filtro';
  btnRemove.style.cssText='padding:4px 10px;cursor:pointer;';

  function go(){
    const v=sel.value;
    const url=new URL(location.href);
    // garante que estamos no modo certo
    url.searchParams.set('screen','ranking');
    url.searchParams.set('mode','con_ally');

    if(v===''){
      // não mexe no parâmetro, só recarrega no mesmo modo
      location.href=url.toString();
      return;
    }
    url.searchParams.set(param, String(parseInt(v,10))); // remove 0 à esquerda se precisar
    location.href=url.toString();
  }

  btn.addEventListener('click', go);
  sel.addEventListener('change', go);

  btnRemove.addEventListener('click', function(){
    const url=new URL(location.href);
    url.searchParams.delete(param);
    url.searchParams.set('screen','ranking');
    url.searchParams.set('mode','con_ally');
    location.href=url.toString();
  });

  box.appendChild(sel);
  box.appendChild(btn);
  box.appendChild(btnRemove);

  // insere no topo do conteúdo
  const anchor=document.querySelector('#content_value') || document.body;
  anchor.prepend(box);
})();
