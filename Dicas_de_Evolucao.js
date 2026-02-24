javascript:
/*
// Licença: MIT
// Copyright (c) Cap Caverna & Ge
*/

(function() {
    const id = 'ppp_caverna_strat_hub';
    if (document.getElementById(id)) { document.getElementById(id).remove(); return; }

    const ordemEdificios = [
        'main', 'barracks', 'stable', 'garage', 'watchtower', 'church', 'church_f', 
        'snob', 'smith', 'place', 'statue', 'market', 'wood', 'stone', 'iron', 
        'farm', 'storage', 'hide', 'wall'
    ];

    const configDominaria = {
        main: { n: 'Edifício Principal', c: 'RECURSO', t: 'tag-res', b: 'Acelera a velocidade de construção.' },
        barracks: { n: 'Quartel', c: 'DEF/ATK', t: 'tag-def', b: 'Recrutamento de infantaria.' },
        stable: { n: 'Estábulo', c: 'ATAQUE', t: 'tag-off', b: 'Produção de cavalaria.' },
        garage: { n: 'Oficina', c: 'ATAQUE', t: 'tag-off', b: 'Produção de cerco.' },
        watchtower: { n: 'Torre de Vigia', c: 'DEFESA', t: 'tag-def', b: 'Detecta ataques à distância.' },
        church: { n: 'Igreja', c: 'RECURSO', t: 'tag-res', b: 'Fé: Aumenta o poder de combate.' },
        church_f: { n: 'Primeira Igreja', c: 'RECURSO', t: 'tag-res', b: 'Fé: Aumenta o poder de combate.' },
        snob: { n: 'Academia', c: 'ATAQUE', t: 'tag-off', b: 'Criação de Nobres.' },
        smith: { n: 'Ferreiro', c: 'RECURSO', t: 'tag-res', b: 'Tecnologias de combate.' },
        place: { n: 'Praça de Reunião', c: 'ESTRATÉGIA', t: 'tag-def', b: 'Centro de comando de tropas.' },
        statue: { n: 'Estátua', c: 'ESTRATÉGIA', t: 'tag-off', b: 'Santuário para o Paladino.' },
        market: { n: 'Mercado', c: 'RECURSO', t: 'tag-res', b: 'Transporte de recursos.' },
        wood: { n: 'Bosque', c: 'RECURSO', t: 'tag-res', b: 'Produção de madeira.' },
        stone: { n: 'Poço de Argila', c: 'RECURSO', t: 'tag-res', b: 'Produção de argila.' },
        iron: { n: 'Mina de Ferro', c: 'RECURSO', t: 'tag-res', b: 'Produção de ferro.' },
        farm: { n: 'Fazenda', c: 'DEFESA', t: 'tag-def', b: 'Limite de população.' },
        storage: { n: 'Armazém', c: 'RECURSO', t: 'tag-res', b: 'Capacidade de estoque.' },
        hide: { n: 'Esconderijo', c: 'DEFESA', t: 'tag-def', b: 'Protege contra saques.' },
        wall: { n: 'Muralha', c: 'DEFESA', t: 'tag-def', b: 'Bônus de defesa.' }
    };

    const style = document.createElement('style');
    style.innerHTML = `
        #${id} { position: fixed; top: 10%; left: 15px; width: 330px; background: #f4e4bc; border: 3px solid #3b240b; z-index: 99999; padding: 10px; border-radius: 8px; font-family: Verdana; box-shadow: 0 0 20px rgba(0,0,0,0.6); }
        .ppp_h { background: #3b240b; color: #f4e4bc; padding: 10px; font-weight: bold; text-align: center; margin: -10px -10px 10px -10px; font-size: 13px; cursor: move; border-radius: 5px 5px 0 0; text-transform: uppercase; position: relative; }
        .ppp_x { position: absolute; right: 10px; top: 8px; cursor: pointer; color: #f4e4bc; font-size: 18px; }
        .ppp_cont { max-height: 500px; overflow-y: auto; overflow-x: hidden; padding-right: 5px; }
        .ppp_card { background: #fff; border: 1px solid #bd9c5a; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
        .ppp_top_row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .ppp_t { font-size: 13px; font-weight: bold; color: #3b240b; }
        .ppp_b { font-size: 10px; color: #666; font-style: italic; margin-bottom: 8px; line-height: 1.2; display: block; }
        .ppp_res_row { font-size: 10px; font-weight: bold; color: #4b250a; margin-bottom: 5px; border-top: 1px solid #eee; padding-top: 4px; display: flex; justify-content: space-between; }
        .ppp_status_row { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: bold; }
        .tag_ppp { font-size: 9px; padding: 2px 5px; border-radius: 4px; color: #fff; font-weight: bold; }
        .tag-off { background: #c0392b; } .tag-def { background: #2980b9; } .tag-res { background: #27ae60; }
        .btn_ppp { background: #21881e; color: #fff; border: none; padding: 5px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 10px; }
        .btn_ppp:disabled { background: #bdc3c7; cursor: not-allowed; opacity: 0.8; }
        .ppp_f { font-size: 10px; text-align: center; margin-top: 8px; font-weight: bold; color: #3b240b; opacity: 0.8; font-style: italic; }
    `;
    document.head.appendChild(style);

    const m = document.createElement('div');
    m.id = id;
    m.innerHTML = `<div class="ppp_h" id="${id}_h">DICA DE EVOLUÇÃO<span class="ppp_x" onclick="this.parentElement.parentElement.remove()">×</span></div><div class="ppp_cont" id="ppp_body"></div><div class="ppp_f">by cap caverna</div>`;
    document.body.appendChild(m);

    let p1=0,p2=0,p3=0,p4=0;
    document.getElementById(id+"_h").onmousedown=(e)=>{
        if(e.target.className === 'ppp_x') return;
        e.preventDefault(); p3=e.clientX; p4=e.clientY;
        document.onmouseup=()=>{ document.onmouseup=null; document.onmousemove=null; };
        document.onmousemove=(e)=>{
            e.preventDefault(); p1=p3-e.clientX; p2=p4-e.clientY; p3=e.clientX; p4=e.clientY;
            m.style.top=(m.offsetTop-p2)+"px"; m.style.left=(m.offsetLeft-p1)+"px";
        };
    };

    function update() {
        const getVal = (id) => parseInt(document.getElementById(id)?.innerText.replace(/\./g, '')) || 0;
        const resNow = { w: getVal("wood"), c: getVal("stone"), i: getVal("iron") };
        let html = '';

        ordemEdificios.forEach(key => {
            const row = document.getElementById(`main_buildrow_${key}`);
            const info = configDominaria[key];
            
            let statusText = '', statusColor = '', btnText = 'EVOLUIR';
            let costWood=0, costStone=0, costIron=0, btn = null;

            if (!row) {
                if (['watchtower', 'church', 'church_f', 'statue'].includes(key)) {
                    statusText = '○ N/A';
                    statusColor = '#7f8c8d';
                    btnText = 'OFF';
                } else { return; }
            } else {
                const parseResource = (row, type) => {
                    const cell = row.querySelector(`.cost_${type}`);
                    if (!cell) return 0;
                    const match = cell.innerText.match(/[\d.]+/);
                    return match ? parseInt(match[0].replace(/\./g, '')) : 0;
                };

                costWood = parseResource(row, 'wood');
                costStone = parseResource(row, 'stone');
                costIron = parseResource(row, 'iron');
                btn = row.querySelector(".btn-build, .build_link, .btn-upgrade");
                const hasValidCost = (costWood > 0 || costStone > 0 || costIron > 0);

                if (!btn && !hasValidCost) {
                    statusText = '● CONCLUÍDO';
                    statusColor = '#2980b9';
                    btnText = 'MAX';
                } else if (hasValidCost && (resNow.w >= costWood && resNow.c >= costStone && resNow.i >= costIron)) {
                    statusText = '● PRONTO';
                    statusColor = '#21881e';
                } else {
                    statusText = '○ AGUARDANDO';
                    statusColor = '#ff0000';
                }
            }

            html += `<div class="ppp_card" style="opacity: ${statusText === '○ N/A' ? '0.5' : '1'}">
                <div class="ppp_top_row">
                    <span class="ppp_t">${info.n}</span>
                    <button class="btn_ppp" ${(!btn || statusText.includes('CONCLUÍDO') || statusText.includes('AGUARDANDO') || statusText.includes('N/A')) ? 'disabled' : ''} onclick="location.href='${btn?btn.href:'#'}'">${btnText}</button>
                </div>
                <span class="ppp_b">${info.b}</span>
                <div class="ppp_res_row">
                    <span>M: ${costWood}</span><span>A: ${costStone}</span><span>F: ${costIron}</span>
                </div>
                <div class="ppp_status_row">
                    <span class="tag_ppp ${info.t}">${info.c}</span>
                    <span style="color:${statusColor}">${statusText}</span>
                </div>
            </div>`;
        });

        const body = document.getElementById("ppp_body");
        if (body && body.innerHTML !== html) body.innerHTML = html;
    }

    update(); setInterval(update, 2500);
})();
