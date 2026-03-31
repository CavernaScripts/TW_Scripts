javascript:(function () {
    'use strict';

    const ID_PAINEL = 'mestre_auto_agenda_v46';

    if (document.getElementById(ID_PAINEL)) {
        document.getElementById(ID_PAINEL).remove();
        return;
    }

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
        <button id="btn_start" style="width:100%; padding:12px; background:#28a745; color:#fff; border:none; cursor:pointer; font-weight:bold; border-radius:3px; box-shadow: 0 2px #1e7e34;">ABRIR E PREENCHER AGENDA</button>
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

    document.getElementById('target_coord').value = state.t || '';
    document.getElementById('num_windows').value = state.n || 4;
    document.getElementById('target_time').value = state.time || '';

    function pad(n, size = 2) {
        return String(n).padStart(size, '0');
    }

    function montarIsoHojeOuAmanha(timeStr) {
        const t = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
        if (!t) return null;

        const agora = new Date();
        const ms = (t[4] || '000').padEnd(3, '0');

        const alvo = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            Number(t[1]),
            Number(t[2]),
            Number(t[3]),
            Number(ms)
        );

        if (alvo.getTime() <= agora.getTime()) {
            alvo.setDate(alvo.getDate() + 1);
        }

        return `${alvo.getFullYear()}-${pad(alvo.getMonth() + 1)}-${pad(alvo.getDate())}T${pad(alvo.getHours())}:${pad(alvo.getMinutes())}:${pad(alvo.getSeconds())}.${pad(alvo.getMilliseconds(), 3)}`;
    }

    function clicarAgendaExistente(win, horarioFinal) {
        const tentativasMax = 100;
        let tentativas = 0;

        const timerAgenda = setInterval(() => {
            try {
                if (!win || win.closed) {
                    clearInterval(timerAgenda);
                    return;
                }

                const doc = win.document;
                tentativas++;

                const candidatos = [
                    ...doc.querySelectorAll('a, button, input[type="button"], input[type="submit"], span')
                ];

                const botaoAgenda = candidatos.find(el => {
                    const txt = (el.textContent || el.value || el.title || '').trim().toLowerCase();
                    return txt === 'agenda' || txt.includes('agenda');
                });

                if (botaoAgenda) {
                    botaoAgenda.click();
                    clearInterval(timerAgenda);
                    esperarCampoAgenda(win, horarioFinal);
                    return;
                }

                if (tentativas >= tentativasMax) {
                    clearInterval(timerAgenda);
                    console.warn('Atalho "Agenda" não encontrado na janela.');
                }
            } catch (e) {}
        }, 200);
    }

    function esperarCampoAgenda(win, horarioFinal) {
        const tentativasMax = 100;
        let tentativas = 0;

        const timerCampo = setInterval(() => {
            try {
                if (!win || win.closed) {
                    clearInterval(timerCampo);
                    return;
                }

                const doc = win.document;
                tentativas++;

                const campoHora = doc.getElementById('CStime');

                if (campoHora) {
                    campoHora.value = horarioFinal;
                    campoHora.dispatchEvent(new Event('input', { bubbles: true }));
                    campoHora.dispatchEvent(new Event('change', { bubbles: true }));
                    clearInterval(timerCampo);
                    return;
                }

                if (tentativas >= tentativasMax) {
                    clearInterval(timerCampo);
                    console.warn('Campo #CStime não encontrado após abrir Agenda.');
                }
            } catch (e) {}
        }, 200);
    }

    function configurarJanela(win, tropas, x, y, horarioFinal) {
        const timer = setInterval(() => {
            try {
                if (!win || win.closed) {
                    clearInterval(timer);
                    return;
                }

                const doc = win.document;
                const xInp = doc.getElementById('inputx') || doc.querySelector('input[name="x"]');

                if (xInp && doc.getElementById('unit_input_spear')) {
                    xInp.value = x;

                    const yInp = doc.getElementById('inputy') || doc.querySelector('input[name="y"]');
                    if (yInp) yInp.value = y;

                    for (const u in tropas) {
                        const inp = doc.getElementById('unit_input_' + u);
                        if (inp) inp.value = Number(tropas[u]) > 0 ? tropas[u] : "";
                    }

                    const btnApoio = doc.getElementById('target_support');
                    if (btnApoio) {
                        btnApoio.click();
                        clearInterval(timer);

                        const checkConf = setInterval(() => {
                            try {
                                if (!win || win.closed) {
                                    clearInterval(checkConf);
                                    return;
                                }

                                if (win.location.href.includes('try=confirm')) {
                                    clearInterval(checkConf);
                                    clicarAgendaExistente(win, horarioFinal);
                                }
                            } catch (e) {}
                        }, 200);
                    }
                }
            } catch (e) {}
        }, 300);
    }

    document.getElementById('btn_start').onclick = function () {
        const coord = document.getElementById('target_coord').value.trim();
        const timeStr = document.getElementById('target_time').value.trim();
        const numWindows = parseInt(document.getElementById('num_windows').value, 10) || 4;
        const match = coord.match(/^(\d{3})\|(\d{3})$/);

        if (!match || !timeStr) {
            alert('Preencha Alvo e Horário!');
            return;
        }

        const isoTime = montarIsoHojeOuAmanha(timeStr);
        if (!isoTime) {
            alert('Horário inválido. Use HH:MM:SS.mmm');
            return;
        }

        const x = match[1];
        const y = match[2];

        const tropas = {};
        document.querySelectorAll('.u_in').forEach(i => {
            tropas[i.dataset.unit] = parseInt(i.value, 10) || 0;
        });

        localStorage.setItem(ID_PAINEL, JSON.stringify({
            u: tropas,
            t: coord,
            n: numWindows,
            time: timeStr
        }));

        for (let i = 0; i < numWindows; i++) {
            const left = (i % 5) * 400;
            const top = i < 5 ? 0 : 500;
            const url = `${window.location.origin}/game.php?village=${window.game_data.village.id}&screen=place`;

            const win = window.open(
                url,
                `win_agenda_${i}_${Date.now()}`,
                `width=450,height=550,left=${left},top=${top}`
            );

            if (win) {
                configurarJanela(win, tropas, x, y, isoTime);
            }
        }

        document.getElementById('status_msg').innerText = 'Janelas enviadas!';
    };
})();
