javascript:(function () {
    'use strict';

    const PANEL_ID = 'tw_auto_agenda_unificado_v1';
    const STORE_KEY = PANEL_ID;

    if (document.getElementById(PANEL_ID)) {
        document.getElementById(PANEL_ID).remove();
        return;
    }

    const units = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult'];
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{"u":{},"t":"","time":"","n":4,"offset":0,"nextDay":true}');

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = [
        'position:fixed',
        'top:10%',
        'right:20px',
        'width:320px',
        'background:#f4e4bc',
        'border:2px solid #3b240b',
        'z-index:99999',
        'padding:15px',
        'font-family:Verdana,sans-serif',
        'box-shadow:5px 5px 15px rgba(0,0,0,0.45)',
        'border-radius:6px',
        'color:#3b240b'
    ].join(';');

    panel.innerHTML = `
        <div style="text-align:center; border-bottom:1px solid #3b240b; margin-bottom:10px; padding-bottom:6px; position:relative;">
            <b style="font-size:14px;">AUTO-SNIP & AGENDA</b>
            <span id="tw_close_panel" style="position:absolute; right:0; top:-4px; cursor:pointer; font-weight:bold; font-size:18px;">&times;</span>
        </div>

        <div id="tw_unit_grid" style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:10px;"></div>

        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Alvo (Coord):</label>
            <input id="tw_target_coord" type="text" placeholder="273|386"
                   style="width:90px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>

        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Chegada:</label>
            <input id="tw_target_time" type="text" placeholder="22:00:00.150"
                   style="width:115px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>

        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Offset (ms):</label>
            <input id="tw_offset" type="number"
                   style="width:70px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>

        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:11px; font-weight:bold;">Nº Janelas:</label>
            <input id="tw_num_windows" type="number" min="1" max="10"
                   style="width:55px; border:1px solid #3b240b; padding:2px; font-size:12px; text-align:center;">
        </div>

        <label style="display:flex; align-items:center; gap:6px; margin-bottom:12px; font-size:11px; font-weight:bold; cursor:pointer;">
            <input id="tw_next_day" type="checkbox">
            Somar 1 dia se já passou
        </label>

        <button id="tw_btn_start"
                style="width:100%; padding:12px; background:#28a745; color:#fff; border:none; cursor:pointer; font-weight:bold; border-radius:3px; box-shadow:0 2px #1e7e34;">
            ABRIR E AGENDAR APOIOS
        </button>

        <div id="tw_status_msg" style="margin-top:10px; font-size:10px; text-align:center; font-weight:bold; color:#8b4513;">
            Status: Aguardando
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('tw_close_panel').onclick = () => panel.remove();

    const grid = document.getElementById('tw_unit_grid');
    units.forEach(u => {
        grid.insertAdjacentHTML('beforeend', `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.3); padding:2px; border:1px solid #d2be8c;">
                <img src="/graphic/unit/unit_${u}.png" width="16" height="16">
                <input type="number" class="tw_u_in" data-unit="${u}" value="${saved.u[u] || 0}"
                       style="width:40px; text-align:center; font-size:10px;">
            </div>
        `);
    });

    document.getElementById('tw_target_coord').value = saved.t || '';
    document.getElementById('tw_target_time').value = saved.time || '';
    document.getElementById('tw_num_windows').value = saved.n || 4;
    document.getElementById('tw_offset').value = Number.isFinite(+saved.offset) ? saved.offset : 0;
    document.getElementById('tw_next_day').checked = saved.nextDay !== false;

    function setStatus(msg, color) {
        const el = document.getElementById('tw_status_msg');
        el.textContent = 'Status: ' + msg;
        if (color) el.style.color = color;
    }

    function formatIsoLocal(date) {
        const pad = (n, s = 2) => String(n).padStart(s, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    }

    function parseArrivalToday(timeStr, addNextDayIfPast) {
        const m = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
        if (!m) return null;

        const now = new Date();
        const ms = (m[4] || '000').padEnd(3, '0');

        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            Number(m[1]),
            Number(m[2]),
            Number(m[3]),
            Number(ms)
        );

        if (addNextDayIfPast && d.getTime() <= Date.now()) {
            d.setDate(d.getDate() + 1);
        }

        return d;
    }

    function injectScheduler(childWin, payload) {
        childWin.__tw_auto_payload__ = payload;

        const script = childWin.document.createElement('script');
        script.textContent = `
            (function () {
                'use strict';

                if (window.__tw_auto_scheduler_loaded__) return;
                window.__tw_auto_scheduler_loaded__ = true;

                const payload = window.__tw_auto_payload__;
                if (!payload || !payload.arrivalIso) return;

                function parseDurationMs() {
                    const form = document.querySelector('#command-data-form');
                    if (!form) return null;

                    const cells = Array.from(form.querySelectorAll('td'));
                    const labelCell = cells.find(td => td.textContent.trim().includes('Duração:'));
                    if (!labelCell || !labelCell.nextElementSibling) return null;

                    const txt = labelCell.nextElementSibling.textContent.trim();
                    const m = txt.match(/^(\\d{1,2}):(\\d{2}):(\\d{2})$/);
                    if (!m) return null;

                    return ((+m[1] * 3600) + (+m[2] * 60) + (+m[3])) * 1000;
                }

                function pad(n, size) {
                    return String(n).padStart(size || 2, '0');
                }

                function fmt(ts) {
                    const d = new Date(ts);
                    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
                }

                function run() {
                    const btn = document.getElementById('troop_confirm_submit');
                    if (!btn) return false;
                    if (typeof Timing === 'undefined' || typeof Timing.getCurrentServerTime !== 'function') return false;

                    const durationMs = parseDurationMs();
                    if (durationMs == null) {
                        console.log('[AUTO] Não foi possível ler a duração.');
                        return true;
                    }

                    const arrival = new Date(payload.arrivalIso);
                    if (Number.isNaN(arrival.getTime())) {
                        console.log('[AUTO] Horário de chegada inválido:', payload.arrivalIso);
                        return true;
                    }

                    const offset = parseInt(payload.offset, 10) || 0;
                    const sendTime = arrival.getTime() - durationMs;
                    const delay = sendTime - Timing.getCurrentServerTime() + offset;

                    if (!document.getElementById('tw_auto_box')) {
                        const box = document.createElement('div');
                        box.id = 'tw_auto_box';
                        box.style.cssText = 'margin:8px 0;padding:6px;background:#d5ffce;border:1px solid #3f7f3f;font:11px Verdana;';
                        box.textContent = '[AUTO] Chegada: ' + fmt(arrival.getTime()) + ' | Envio: ' + fmt(sendTime) + ' | Offset: ' + offset + 'ms';
                        const form = document.querySelector('#command-data-form');
                        if (form) form.prepend(box);
                    }

                    btn.disabled = true;
                    btn.classList.add('btn-disabled');

                    console.log('[AUTO] Delay:', delay, 'ms');
                    setTimeout(function () {
                        btn.click();
                    }, Math.max(0, delay));

                    return true;
                }

                const timer = setInterval(function () {
                    try {
                        if (run()) clearInterval(timer);
                    } catch (e) {
                        console.error('[AUTO] Erro:', e);
                        clearInterval(timer);
                    }
                }, 100);
            })();
        `;
        childWin.document.body.appendChild(script);
    }

    function configureWindow(childWin, troops, x, y, payload) {
        const timer = setInterval(() => {
            try {
                if (!childWin || childWin.closed) {
                    clearInterval(timer);
                    return;
                }

                const doc = childWin.document;
                const xInp = doc.getElementById('inputx') || doc.querySelector('input[name="x"]');
                const yInp = doc.getElementById('inputy') || doc.querySelector('input[name="y"]');

                if (!xInp || !yInp || !doc.getElementById('target_support')) return;

                xInp.value = x;
                yInp.value = y;

                for (const u in troops) {
                    const inp = doc.getElementById('unit_input_' + u);
                    if (inp) inp.value = Number(troops[u]) > 0 ? troops[u] : '';
                }

                doc.getElementById('target_support').click();
                clearInterval(timer);

                const waitConfirm = setInterval(() => {
                    try {
                        if (!childWin || childWin.closed) {
                            clearInterval(waitConfirm);
                            return;
                        }

                        if (childWin.location.href.includes('try=confirm')) {
                            clearInterval(waitConfirm);
                            injectScheduler(childWin, payload);
                        }
                    } catch (e) {}
                }, 200);
            } catch (e) {}
        }, 250);
    }

    document.getElementById('tw_btn_start').onclick = function () {
        const coord = document.getElementById('tw_target_coord').value.trim();
        const timeStr = document.getElementById('tw_target_time').value.trim();
        const offset = parseInt(document.getElementById('tw_offset').value, 10) || 0;
        const numWindows = Math.min(10, Math.max(1, parseInt(document.getElementById('tw_num_windows').value, 10) || 4));
        const nextDay = document.getElementById('tw_next_day').checked;

        const coordMatch = coord.match(/^(\\d{3})\\|(\\d{3})$/);
        if (!coordMatch || !timeStr) {
            alert('Preencha Alvo e Horário.');
            return;
        }

        const arrival = parseArrivalToday(timeStr, nextDay);
        if (!arrival) {
            alert('Horário inválido. Use HH:MM:SS.mmm');
            return;
        }

        const troops = {};
        document.querySelectorAll('.tw_u_in').forEach(inp => {
            troops[inp.dataset.unit] = inp.value;
        });

        const state = {
            u: troops,
            t: coord,
            time: timeStr,
            n: numWindows,
            offset: offset,
            nextDay: nextDay
        };
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        localStorage.setItem('CS.offset', String(offset));

        const x = coordMatch[1];
        const y = coordMatch[2];
        const payload = {
            arrivalIso: formatIsoLocal(arrival),
            offset: offset
        };

        let opened = 0;
        for (let i = 0; i < numWindows; i++) {
            const left = (i % 5) * 390;
            const top = i < 5 ? 0 : 480;
            const url = `${window.location.origin}/game.php?village=${window.game_data.village.id}&screen=place`;
            const childWin = window.open(
                url,
                `tw_auto_${i}_${Date.now()}`,
                `width=460,height=600,left=${left},top=${top}`
            );

            if (childWin) {
                opened++;
                configureWindow(childWin, troops, x, y, payload);
            }
        }

        setStatus(
            `Abrindo ${opened}/${numWindows} janelas | Chegada ${timeStr} | Offset ${offset}ms`,
            '#8b4513'
        );
    };
})();
