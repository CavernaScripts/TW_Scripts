javascript:(function() {
    'use strict';
    const ID_PAINEL = 'auto_fake_v29';

    if (document.getElementById(ID_PAINEL)) document.getElementById(ID_PAINEL).remove();

    /* --- INTERFACE AUTO-FAKE --- */
    const div = document.createElement('div');
    div.id = ID_PAINEL;
    div.style = "position:fixed; top:12%; right:20px; width:280px; background:#f4e4bc; border:2px solid #3b240b; z-index:99999; padding:15px; font-family:Verdana; box-shadow:5px 5px 15px rgba(0,0,0,0.5); border-radius:5px;";
    div.innerHTML = `
        <div style="text-align:center; border-bottom:1px solid #3b240b; margin-bottom:10px; padding-bottom:5px; position:relative;">
            <b style="font-size: 14px; color:#3b240b;">AUTO-FAKE</b>
            <span id="close_fake" style="position:absolute; right:-5px; top:-10px; cursor:pointer; font-weight:bold; color:#8b4513; font-size:16px; padding:5px;">&times;</span>
        </div>
        <div id="unit_grid" style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:10px;"></div>
        <textarea id="fake_coords" placeholder="500|500&#10;501|501" style="width:95%; height:100px; margin-bottom:10px; font-size:11px; border:1px solid #3b240b; background:#fff;"></textarea>
        <button id="btn_fake_start" style="width:100%; padding:12px; background:#28a745; color:#fff; border:1px solid #1e7e34; cursor:pointer; font-weight:bold; border-radius:3px; box-shadow: 0 2px #1e7e34;">INICIAR SEQUÊNCIA</button>
        <button id="btn_fake_stop" style="width:100%; padding:8px; background:#dc3545; color:#fff; border:none; cursor:pointer; font-weight:bold; margin-top:5px; display:none;">PARAR LOOP</button>
        <div id="fake_status" style="margin-top:10px; font-size:10px; text-align:center; color:#8b4513; font-weight:bold;">Status: Aguardando</div>
        <div style="text-align:right; font-size:9px; color:#8b4513; margin-top:5px; opacity:0.7;">by Cap Caverna</div>
    `;
    document.body.appendChild(div);

    /* --- LOGICA DE UNIDADES E PERSISTÊNCIA --- */
    const units = ['spear','sword','axe','spy','light','heavy','ram','catapult'];
    const grid = document.getElementById('unit_grid');
    const savedData = JSON.parse(localStorage.getItem(ID_PAINEL) || '{"u":{}, "c":""}');

    units.forEach(u => {
        grid.innerHTML += `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.4); padding:2px; border:1px solid #d2be8c;">
                <img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_${u}.png" width="18">
                <input type="number" class="fake_u" data-unit="${u}" value="${savedData.u[u] || 0}" style="width:40px; text-align:center; font-size:10px; border:1px solid #7d510f;">
            </div>`;
    });
    document.getElementById('fake_coords').value = savedData.c;

    let isRunning = false;
    let attackWindow = null;

    function salvar() {
        const u = {};
        document.querySelectorAll('.fake_u').forEach(i => u[i.dataset.unit] = i.value);
        const c = document.getElementById('fake_coords').value;
        localStorage.setItem(ID_PAINEL, JSON.stringify({u, c}));
        return {u, c};
    }

    /* --- MOTOR DE EXECUÇÃO --- */
    function processarAtaque() {
        if (!isRunning) return;

        const data = salvar();
        const match = data.c.match(/\d{3}\|\d{3}/);
        
        if (!match) {
            UI.SuccessMessage("Lista de Fakes concluída!");
            parar();
            return;
        }

        const target = match[0];
        document.getElementById('fake_status').innerText = `Atacando: ${target}`;

        attackWindow = window.open(`/game.php?village=${window.game_data.village.id}&screen=place`, 'f_loop', 'width=600,height=700');

        const monitorInterno = setInterval(() => {
            try {
                if (!attackWindow || attackWindow.closed) {
                    clearInterval(monitorInterno);
                    return;
                }

                const d = attackWindow.document;
                const btnConf = d.getElementById('troop_confirm_submit');
                const formAtk = d.getElementById('command-data-form');

                if (formAtk && d.querySelector('input.target-input-field') && !d.querySelector('.error_box')) {
                    d.querySelector('input.target-input-field').value = target;
                    for (let unit in data.u) {
                        const inp = d.getElementById('unit_input_' + unit);
                        if (inp && data.u[unit] > 0) inp.value = data.u[unit];
                    }
                    setTimeout(() => { 
                        const bAtk = d.getElementById('target_attack');
                        if (bAtk) bAtk.click(); 
                    }, 400);
                }
                
                if (btnConf) {
                    btnConf.click();
                    clearInterval(monitorInterno);
                    setTimeout(() => {
                        const novaLista = document.getElementById('fake_coords').value.replace(target, "").trim();
                        document.getElementById('fake_coords').value = novaLista;
                        salvar();
                        attackWindow.close();
                    }, 800);
                }
            } catch (e) {}
        }, 700);

        const checarFechamento = setInterval(() => {
            if (!attackWindow || attackWindow.closed) {
                clearInterval(checarFechamento);
                if (isRunning) {
                    document.getElementById('fake_status').innerText = "Delay anti-bot...";
                    setTimeout(processarAtaque, 1800);
                }
            }
        }, 1000);
    }

    function iniciar() {
        if (document.getElementById('fake_coords').value.trim() === "") return UI.ErrorMessage("Insira coordenadas!");
        isRunning = true;
        document.getElementById('btn_fake_start').style.display = 'none';
        document.getElementById('btn_fake_stop').style.display = 'block';
        processarAtaque();
    }

    function parar() {
        isRunning = false;
        document.getElementById('btn_fake_start').style.display = 'block';
        document.getElementById('btn_fake_stop').style.display = 'none';
        document.getElementById('fake_status').innerText = "Status: Parado";
    }

    /* --- BIND DOS BOTÕES --- */
    document.getElementById('btn_fake_start').onclick = iniciar;
    document.getElementById('btn_fake_stop').onclick = parar;
    document.getElementById('close_fake').onclick = () => {
        isRunning = false;
        if(attackWindow && !attackWindow.closed) attackWindow.close();
        document.getElementById(ID_PAINEL).remove();
    };

})();
