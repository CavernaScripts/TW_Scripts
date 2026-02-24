javascript:(function(){

const id = "ed_direcionada_popup";
if(document.getElementById(id)){
    document.getElementById(id).remove();
    return;
}

const estrategias = {
    mar_azul: [
        {key:"wood", nome:"Bosque"}, {key:"stone", nome:"Poço de Argila"}, {key:"iron", nome:"Mina de Ferro"},
        {key:"storage", nome:"Armazém"}, {key:"farm", nome:"Fazenda"}, {key:"main", nome:"Edifício Principal"},
        {key:"market", nome:"Mercado"}
    ],
    front: [
        {key:"wall", nome:"Muralha"}, {key:"main", nome:"Edifício Principal"}, {key:"barracks", nome:"Quartel"},
        {key:"farm", nome:"Fazenda"}, {key:"storage", nome:"Armazém"}, {key:"smith", nome:"Ferreiro"}
    ],
    defesa: [
        {key:"wall", nome:"Muralha"}, {key:"barracks", nome:"Quartel"}, {key:"farm", nome:"Fazenda"},
        {key:"stone", nome:"Poço de Argila"}, {key:"smith", nome:"Ferreiro"}, {key:"storage", nome:"Armazém"}
    ],
    ataque: [
        {key:"barracks", nome:"Quartel"}, {key:"stable", nome:"Estábulo"}, {key:"garage", nome:"Oficina"},
        {key:"wood", nome:"Bosque"}, {key:"smith", nome:"Ferreiro"}, {key:"farm", nome:"Fazenda"}
    ],
    alternativo: [
        {key:"main", nome:"Edifício Principal"}, {key:"smith", nome:"Ferreiro"}, {key:"storage", nome:"Armazém"},
        {key:"farm", nome:"Fazenda"}, {key:"market", nome:"Mercado"}, {key:"stable", nome:"Estábulo"}
    ]
};

const box = document.createElement("div");
box.id = id;
box.style = "position:fixed;top:15%;left:35%;width:420px;background:#f4e4bc;border:3px solid #3b240b;z-index:999999;border-radius:10px;box-shadow:0 0 25px rgba(0,0,0,0.7);font-family:Verdana;";

box.innerHTML = `
<div style="background:#3b240b;color:#fff;padding:12px;font-weight:bold;text-align:center;font-size:14px;">
    DIRECIONADOR DE EVOLUÇÃO - PPP
    <span style="float:right;cursor:pointer;" onclick="document.getElementById('${id}').remove()">✖</span>
</div>
<div style="padding:15px;">
    <select id="tipoAldeia" style="width:100%;padding:6px;margin-bottom:15px;font-weight:bold;border:1px solid #3b240b;">
        <option value="">ESCOLHA O MODELO DE CONSTRUÇÃO</option>
        <option value="mar_azul">MAR AZUL (Recursos/Estabilidade)</option>
        <option value="front">FRONT (Guerra/Muralha)</option>
        <option value="defesa">DEFESA (Quartel/Muralha)</option>
        <option value="ataque">ATAQUE (Ofensivo/Cavalaria)</option>
        <option value="alternativo">ALTERNATIVO (Híbrido)</option>
    </select>
    <div id="resultadoDirecionamento"></div>
    <div style="margin-top:10px;font-size:10px;color:#3b240b;text-align:center;border-top:1px solid #bd9c5a;padding-top:5px;">
        Modo: Apenas Sugestão (Manual)
    </div>
</div>
`;

document.body.appendChild(box);

function encontrarProximaOpcao(lista){
    for(let item of lista){
        const row = document.getElementById("main_buildrow_"+item.key);
        if(!row) continue;
        
        /* Captura o botão que NÃO gasta PPs (evita btn-instant-free e similares) */
        const btn = row.querySelector(".btn-build, .btn-upgrade, .build_link");
        
        if(btn && !btn.classList.contains('btn-disabled')){
            return { nome:item.nome, key:item.key, botao:btn };
        }
    }
    return null;
}

document.getElementById("tipoAldeia").onchange = function(){
    const tipo = this.value;
    const area = document.getElementById("resultadoDirecionamento");

    if(!tipo){ area.innerHTML = ""; return; }

    const proximo = encontrarProximaOpcao(estrategias[tipo]);

    if(!proximo){
        area.innerHTML = "<div style='background:#fff;padding:10px;border-radius:5px;text-align:center;border:1px solid #bd9c5a;'><b>Nenhuma construção disponível no momento.</b></div>";
        return;
    }

    area.innerHTML = `
        <div style="background:#fff;border:1px solid #bd9c5a;border-radius:8px;padding:12px;">
            <div style="font-weight:bold;font-size:13px;margin-bottom:8px;color:#3b240b;">Sugestão PPP:</div>
            <div style="margin-bottom:5px;">Edifício: <b style="color:#21881e;">${proximo.nome}</b></div>
            <div style="margin-bottom:10px;">Modelo: <b>${tipo.toUpperCase().replace('_', ' ')}</b></div>
            <button id="executarEvo" style="background:#21881e;color:#fff;border:none;padding:10px;border-radius:5px;font-weight:bold;cursor:pointer;width:100%;">
                CONFIRMAR CONSTRUÇÃO
            </button>
        </div>
    `;

    document.getElementById("executarEvo").onclick = function(){
        proximo.botao.click();
    };
};

})();
