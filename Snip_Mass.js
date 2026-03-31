javascript:(function () {
    'use strict';
    const ID_PAINEL = 'mestre_auto_agenda_v45';

    if (document.getElementById(ID_PAINEL)) document.getElementById(ID_PAINEL).remove();

    const div = document.createElement('div');
    div.id = ID_PAINEL;
    div.style = "position:fixed; top:10%; right:20px; width:300px; background:#f4e4bc; border:2px solid #3b240b; z-index:99999; padding:15px; font-family:Verdana; box-shadow:5px 5px 15px rgba(0,0,0,0.5); border-radius:5px; color:#3b240b;";
    div.innerHTML = `
        <div style="text-align:center; border-bottom:1px solid #3b240b; margin-bottom:10px; padding-bottom:5px; position:relative;">
            <b style="font-size:14px;">AUTO-SNIP & AGENDA (4X)</b>
            <span onclick="this.parentElement.parentElement.remove()" style="position:absolute; right:0; top:-5px; cursor:pointer; font-weight:bold; font-size:18px;">&times;</span>
        </div>
        <div id="unit_grid" style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:10px;"></div>
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Alvo (Coord):</label>
            <input id="target_coord" type="text" placeholder="273|386" style="width:80px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Chegada (HH:MM:SS.mmm):</label>
            <input id="target_time" type="text" placeholder="22:00:00.150" style="width:110px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>
        <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Nº Janelas (1-10):</label>
            <input id="num_windows" type="number" value="4" min="1" max="10" style="width:50px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>
        <button id="btn_start" style="width:100%; padding:12px; background:#28a745; color:#fff; border:none; cursor:pointer; font-weight:bold; border-radius:3px; box-shadow: 0 2px #1e7e34;">ABRIR E AGENDAR APOIOS</button>
        <div id="status_msg" style="margin-top:10px; font-size:10px; text-align:center; font-weight:bold; color:#8b4513;">Status: Aguardando</div>
    `;
    document.body.appendChild(div);

    const units = ['spear','sword','axe','spy','light','heavy','ram','catapult'];
    const grid = document.getElementById('unit_grid');
    const state = JSON.parse(localStorage.getItem(ID_PAINEL) || '{"u":{}, "t":"", "n":4, "time":""}');

    units.forEach(u => {
        grid.innerHTML += `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.3); padding:2px; border:1px solid #d2be8c;">
                <img src="/graphic/unit/unit_${u}.png" width="16">
                <input type="number" class="u_in" data-unit="${u}" value="${state.u[u] || 0}" style="width:40px; text-align:center; font-size:10px;">
            </div>`;
    });
    document.getElementById('target_coord').value = state.t;
    document.getElementById('num_windows').value = state.n;
    document.getElementById('target_time').value = state.time;

    function configurarJanela(win, tropas, x, y, horarioFinal) {
        const timer = setInterval(() => {
            try {
                if (!win || win.closed) { clearInterval(timer); return; }
                const doc = win.document;
                const xInp = doc.getElementById('inputx') || doc.querySelector('input[name="x"]');
                if (xInp && doc.getElementById('unit_input_spear')) {
                    xInp.value = x;
                    doc.getElementById('inputy').value = y;
                    for (const u in tropas) {
                        const inp = doc.getElementById('unit_input_'+u);
                        if (inp) inp.value = tropas[u] > 0 ? tropas[u] : "";
                    }
                    const btnApoio = doc.getElementById('target_support');
                    if (btnApoio) {
                        btnApoio.click();
                        clearInterval(timer);
                        const checkConf = setInterval(() => {
                            if (win.location.href.includes('try=confirm')) {
                                clearInterval(checkConf);
                                
                                /* INJEÇÃO DE DADOS PARA O FILHO */
                                win.target_auto_time = horarioFinal; 
                                win.auto_schedule_active = true;

                                const script = win.document.createElement('script');
                                script.src = 'https://cdn.jsdelivr.net/gh/CavernaScripts/TW_Scripts@main/Agendador_de_Ataques.js';
                                win.document.body.appendChild(script);
                            }
                        }, 200);
                    }
                }
            } catch (e) {}
        }, 300);
    }

    document.getElementById('btn_start').onclick = function () {
        const coord = document.getElementById('target_coord').value.trim();
        const timeStr = document.getElementById('target_time').value.trim();
        const numWindows = parseInt(document.getElementById('num_windows').value) || 4;
        const match = coord.match(/(\d{3})\|(\d{3})/);
        
        if (!match || !timeStr) return alert('Preencha Alvo e Horário!');

        const x = match[1];
        const y = match[2];
        const tropas = {};
        document.querySelectorAll('.u_in').forEach(i => tropas[i.dataset.unit] = i.value);
        localStorage.setItem(ID_PAINEL, JSON.stringify({u: tropas, t: coord, n: numWindows, time: timeStr}));

        const agora = new Date();
        const t = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
        const mmm = (t[4] || '000').padEnd(3, '0');
        const isoTime = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}T${t[1]}:${t[2]}:${t[3]}.${mmm}`;

        for (let i = 0; i < numWindows; i++) {
            const left = (i % 5) * 400;
            const top = i < 5 ? 0 : 500;
            const url = `${window.location.origin}/game.php?village=${window.game_data.village.id}&screen=place`;
            const win = window.open(url, `win_agenda_${i}_${Date.now()}`, `width=450,height=550,left=${left},top=${top}`);
            
            if (win) {
                configurarJanela(win, tropas, x, y, isoTime);
            }
        }
        document.getElementById('status_msg').innerText = "Janelas enviadas!";
    };
})();
