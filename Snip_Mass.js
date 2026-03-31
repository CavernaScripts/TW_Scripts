javascript:(function () {
    'use strict';

    const PANEL_ID = 'tw_auto_agenda_unificado_v2';
    const STORE_KEY = PANEL_ID;
    const UNITS = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult'];

    if (document.getElementById(PANEL_ID)) {
        document.getElementById(PANEL_ID).remove();
        return;
    }

    function safeLoad() {
        try {
            return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    const saved = Object.assign({
        u: {},
        t: '',
        time: '',
        n: 4,
        offset: 0,
        nextDay: true
    }, safeLoad());

    function el(id) {
        return document.getElementById(id);
    }

    function setStatus(msg, color) {
        const node = el('tw_status_msg');
        if (!node) return;
        node.textContent = 'Status: ' + msg;
        if (color) node.style.color = color;
    }

    function pad(n, size = 2) {
        return String(n).padStart(size, '0');
    }

    function formatIsoLocal(date) {
        return [
            date.getFullYear(), '-', pad(date.getMonth() + 1), '-', pad(date.getDate()),
            'T', pad(date.getHours()), ':', pad(date.getMinutes()), ':', pad(date.getSeconds()),
            '.', pad(date.getMilliseconds(), 3)
        ].join('');
    }

    function parseArrivalToday(timeStr, addNextDayIfPast) {
        const m = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(timeStr);
        if (!m) return null;

        const now = new Date();
        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            Number(m[1]),
            Number(m[2]),
            Number(m[3]),
            Number((m[4] || '0').padEnd(3, '0'))
        );

        if (addNextDayIfPast && d.getTime() <= Date.now()) {
            d.setDate(d.getDate() + 1);
        }
        return d;
    }

    function collectTroops() {
        const troops = {};
        let total = 0;

        document.querySelectorAll('.tw_u_in').forEach(inp => {
            const value = Math.max(0, parseInt(inp.value, 10) || 0);
            troops[inp.dataset.unit] = value;
            total += value;
        });

        return { troops, total };
    }

    function injectScheduler(childWin, payload) {
        try {
            childWin.__tw_auto_payload__ = payload;

            const target = childWin.document.body || childWin.document.documentElement;
            if (!target) return;

            const script = childWin.document.createElement('script');
            script.textContent = `
                (function () {
                    'use strict';
                    if (window.__tw_auto_scheduler_loaded__) return;
                    window.__tw_auto_scheduler_loaded__ = true;

                    const payload = window.__tw_auto_payload__;
                    if (!payload || !payload.arrivalIso) return;

                    function pad(n, size) {
                        return String(n).padStart(size || 2, '0');
                    }

                    function fmt(ts) {
                        const d = new Date(ts);
                        return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
                    }

                    function parseDurationMs() {
                        const form = document.querySelector('#command-data-form');
                        if (!form) return null;

                        const cells = Array.from(form.querySelectorAll('td'));
                        const labelCell = cells.find(td => td.textContent.trim().includes('Duração:'));
                        if (!labelCell || !labelCell.nextElementSibling) return null;

                        const txt = labelCell.nextElementSibling.textContent.trim();
                        const m = /^(\\d{1,2}):(\\d{2}):(\\d{2})$/.exec(txt);
                        if (!m) return null;

                        return ((+m[1] * 3600) + (+m[2] * 60) + (+m[3])) * 1000;
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
                            console.log('[AUTO] Horário inválido:', payload.arrivalIso);
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

                        if (delay < -3000) {
                            console.log('[AUTO] Horário já passou. Delay:', delay);
                            return true;
                        }

                        btn.disabled = true;
                        btn.classList.add('btn-disabled');
                        console.log('[AUTO] Delay:', delay, 'ms');

                        setTimeout(function () {
                            btn.click();
                        }, Math.max(0, delay));

                        return true;
                    }

                    let tries = 0;
                    const timer = setInterval(function () {
                        tries++;
                        try {
                            if (run() || tries > 300) clearInterval(timer);
                        } catch (e) {
                            console.error('[AUTO] Erro:', e);
                            clearInterval(timer);
                        }
                    }, 100);
                })();
            `;
            target.appendChild(script);
        } catch (e) {
            console.error('[AUTO] Falha ao injetar scheduler:', e);
        }
    }

    function configureWindow(childWin, troops, x, y, payload) {
        let tries = 0;

        const timer = setInterval(() => {
            tries++;
            try {
                if (!childWin || childWin.closed || tries > 240) {
                    clearInterval(timer);
                    return;
                }

                const doc = childWin.document;
                const xInp = doc.getElementById('inputx') || doc.querySelector('input[name="x"]');
                const yInp = doc.getElementById('inputy') || doc.querySelector('input[name="y"]');
                const supportBtn = doc.getElementById('target_support');

                if (!xInp || !yInp || !supportBtn) return;

                xInp.value = x;
                yInp.value = y;

                Object.keys(troops).forEach(u => {
                    const inp = doc.getElementById('unit_input_' + u);
                    if (inp) inp.value = troops[u] > 0 ? troops[u] : '';
                });

                supportBtn.click();
                clearInterval(timer);

                let confirmTries = 0;
                const waitConfirm = setInterval(() => {
                    confirmTries++;
                    try {
                        if (!childWin || childWin.closed || confirmTries > 200) {
                            clearInterval(waitConfirm);
                            return;
                        }

                        if (childWin.location.href.includes('try=confirm')) {
                            clearInterval(waitConfirm);
                            injectScheduler(childWin, payload);
                        }
                    } catch {}
                }, 200);
            } catch {}
        }, 250);
    }

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
        <div style="text-align:center;border-bottom:1px solid #3b240b;margin-bottom:10px;padding-bottom:6px;position:relative;">
            <b style="font-size:14px;">AUTO-SNIP & AGENDA</b>
            <span id="tw_close_panel" style="position:absolute;right:0;top:-4px;cursor:pointer;font-weight:bold;font-size:18px;">&times;</span>
        </div>

        <div id="tw_unit_grid" style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px;"></div>

        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <label style="font-size:11px;font-weight:bold;">Alvo (Coord):</label>
            <input id="tw_target_coord" type="text" placeholder="273|386" style="width:90px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
        </div>

        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <label style="font-size:11px;font-weight:bold;">Chegada:</label>
            <input id="tw_target_time" type="text" placeholder="22:00:00.150" style="width:115px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
        </div>

        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <label style="font-size:11px;font-weight:bold;">Offset (ms):</label>
            <input id="tw_offset" type="number" style="width:70px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
        </div>

        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <label style="font-size:11px;font-weight:bold;">Nº Janelas:</label>
            <input id="tw_num_windows" type="number" min="1" max="10" style="width:55px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
        </div>

        <label style="display:flex;align-items:center;gap:6px;margin-bottom:12px;font-size:11px;font-weight:bold;cursor:pointer;">
            <input id="tw_next_day" type="checkbox"> Somar 1 dia se já passou
        </label>

        <button id="tw_btn_start" style="width:100%;padding:12px;background:#28a745;color:#fff;border:none;cursor:pointer;font-weight:bold;border-radius:3px;box-shadow:0 2px #1e7e34;">
            ABRIR E AGENDAR APOIOS
        </button>

        <div id="tw_status_msg" style="margin-top:10px;font-size:10px;text-align:center;font-weight:bold;color:#8b4513;">
            Status: Aguardando
        </div>
    `;

    document.body.appendChild(panel);

    el('tw_close_panel').onclick = () => panel.remove();

    const grid = el('tw_unit_grid');
    UNITS.forEach(u => {
        grid.insertAdjacentHTML('beforeend', `
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.3);padding:2px;border:1px solid #d2be8c;">
                <img src="/graphic/unit/unit_${u}.png" width="16" height="16">
                <input type="number" class="tw_u_in" data-unit="${u}" value="${saved.u[u] || 0}" style="width:40px;text-align:center;font-size:10px;">
            </div>
        `);
    });

    el('tw_target_coord').value = saved.t || '';
    el('tw_target_time').value = saved.time || '';
    el('tw_num_windows').value = saved.n || 4;
    el('tw_offset').value = Number.isFinite(+saved.offset) ? saved.offset : 0;
    el('tw_next_day').checked = saved.nextDay !== false;

    el('tw_btn_start').onclick = function () {
        const coord = el('tw_target_coord').value.trim();
        const timeStr = el('tw_target_time').value.trim();
        const offset = parseInt(el('tw_offset').value, 10) || 0;
        const numWindows = Math.min(10, Math.max(1, parseInt(el('tw_num_windows').value, 10) || 4));
        const nextDay = el('tw_next_day').checked;

        const coordMatch = /^(\d{3})\|(\d{3})$/.exec(coord);
        if (!coordMatch || !timeStr) {
            alert('Preencha Alvo e Horário.');
            return;
        }

        const arrival = parseArrivalToday(timeStr, nextDay);
        if (!arrival) {
            alert('Horário inválido. Use HH:MM:SS.mmm');
            return;
        }

        const { troops, total } = collectTroops();
        if (total <= 0) {
            alert('Informe ao menos uma unidade.');
            return;
        }

        const state = {
            u: troops,
            t: coord,
            time: timeStr,
            n: numWindows,
            offset,
            nextDay
        };

        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        localStorage.setItem('CS.offset', String(offset));

        const x = coordMatch[1];
        const y = coordMatch[2];
        const payload = {
            arrivalIso: formatIsoLocal(arrival),
            offset
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

        if (!opened) {
            setStatus('Nenhuma janela abriu. Verifique o bloqueador de pop-up.', '#b22222');
            return;
        }

        setStatus(`Abrindo ${opened}/${numWindows} janelas | Chegada ${timeStr} | Offset ${offset}ms`, '#8b4513');
    };
})();
