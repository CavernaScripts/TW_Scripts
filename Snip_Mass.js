javascript:(function () {
    'use strict';

    const PANEL_ID = 'tw_auto_snip_agenda_full_v2';
    const STORAGE_KEY = PANEL_ID;
    const UNITS = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult'];

    if (document.getElementById(PANEL_ID)) {
        document.getElementById(PANEL_ID).remove();
        return;
    }

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify({
        units: {},
        coord: '',
        time: '',
        windows: 4,
        offset: 0,
        nextDay: true
    }));

    function el(tag, html, style) {
        const node = document.createElement(tag);
        if (html != null) node.innerHTML = html;
        if (style) node.style.cssText = style;
        return node;
    }

    function pad(n, size = 2) {
        return String(n).padStart(size, '0');
    }

    function setStatus(msg, color = '#8b4513') {
        const status = document.getElementById('tw_as_status');
        if (!status) return;
        status.textContent = 'Status: ' + msg;
        status.style.color = color;
    }

    function normalizeCoord(raw) {
        if (!raw) return '';
        return raw
            .trim()
            .replace(/[^\d|,;/\\-]/g, '')
            .replace(/[,;/\\-]+/g, '|');
    }

    function parseCoord(raw) {
        const value = normalizeCoord(raw);
        const match = value.match(/^(\d{3})\|(\d{3})$/);
        if (!match) return null;
        return { x: match[1], y: match[2], value };
    }

    function parseTime(raw) {
        if (!raw) return null;
        const m = raw.trim().match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
        if (!m) return null;

        const h = +m[1], min = +m[2], s = +m[3], ms = +((m[4] || '000').padEnd(3, '0'));
        if (h > 23 || min > 59 || s > 59 || ms > 999) return null;

        return { h, min, s, ms };
    }

    function buildArrivalDate(timeParts, addNextDayIfPast) {
        const now = new Date();
        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            timeParts.h,
            timeParts.min,
            timeParts.s,
            timeParts.ms
        );

        if (addNextDayIfPast && d.getTime() <= Date.now()) {
            d.setDate(d.getDate() + 1);
        }

        return d;
    }

    function formatIsoLocal(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    }

    function formatReadable(date) {
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    }

    function buildPanel() {
        const panel = el('div', null, [
            'position:fixed',
            'top:10%',
            'right:20px',
            'width:340px',
            'background:#f4e4bc',
            'border:2px solid #3b240b',
            'z-index:99999',
            'padding:15px',
            'font-family:Verdana,sans-serif',
            'box-shadow:5px 5px 15px rgba(0,0,0,0.5)',
            'border-radius:6px',
            'color:#3b240b'
        ].join(';'));
        panel.id = PANEL_ID;

        panel.innerHTML = `
            <div style="text-align:center;border-bottom:1px solid #3b240b;margin-bottom:10px;padding-bottom:6px;position:relative;">
                <b style="font-size:14px;">AUTO-SNIP & AGENDA</b>
                <span id="tw_as_close" style="position:absolute;right:0;top:-4px;cursor:pointer;font-weight:bold;font-size:18px;">&times;</span>
            </div>

            <div id="tw_as_units" style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px;"></div>

            <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:11px;font-weight:bold;">Alvo (Coord):</label>
                <input id="tw_as_coord" type="text" placeholder="273|386" style="width:95px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
            </div>

            <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:11px;font-weight:bold;">Chegada:</label>
                <input id="tw_as_time" type="text" placeholder="22:00:00.150" style="width:120px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
            </div>

            <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:11px;font-weight:bold;">Offset (ms):</label>
                <input id="tw_as_offset" type="number" style="width:75px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
            </div>

            <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:11px;font-weight:bold;">Nº Janelas:</label>
                <input id="tw_as_windows" type="number" min="1" max="10" style="width:60px;border:1px solid #3b240b;padding:2px;font-size:12px;text-align:center;">
            </div>

            <label style="display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:11px;font-weight:bold;cursor:pointer;">
                <input id="tw_as_nextday" type="checkbox">
                Somar 1 dia se já passou
            </label>

            <div id="tw_as_preview" style="margin-bottom:12px;padding:6px;background:rgba(255,255,255,.35);border:1px solid #d2be8c;font-size:10px;line-height:1.4;">
                Chegada calculada: —
            </div>

            <button id="tw_as_start" style="width:100%;padding:12px;background:#28a745;color:#fff;border:none;cursor:pointer;font-weight:bold;border-radius:3px;box-shadow:0 2px #1e7e34;">
                ABRIR E AGENDAR APOIOS
            </button>

            <div id="tw_as_status" style="margin-top:10px;font-size:10px;text-align:center;font-weight:bold;color:#8b4513;">
                Status: Aguardando
            </div>
        `;

        document.body.appendChild(panel);

        document.getElementById('tw_as_close').onclick = () => panel.remove();

        const unitsBox = document.getElementById('tw_as_units');
        UNITS.forEach(unit => {
            unitsBox.insertAdjacentHTML('beforeend', `
                <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.3);padding:2px;border:1px solid #d2be8c;">
                    <img src="/graphic/unit/unit_${unit}.png" width="16" height="16">
                    <input type="number" class="tw_as_unit" data-unit="${unit}" value="${saved.units[unit] || 0}" style="width:40px;text-align:center;font-size:10px;">
                </div>
            `);
        });

        document.getElementById('tw_as_coord').value = saved.coord || '';
        document.getElementById('tw_as_time').value = saved.time || '';
        document.getElementById('tw_as_windows').value = saved.windows || 4;
        document.getElementById('tw_as_offset').value = Number.isFinite(+saved.offset) ? saved.offset : 0;
        document.getElementById('tw_as_nextday').checked = saved.nextDay !== false;

        const refreshPreview = () => {
            const timeParts = parseTime(document.getElementById('tw_as_time').value);
            const preview = document.getElementById('tw_as_preview');
            if (!timeParts) {
                preview.textContent = 'Chegada calculada: horário inválido';
                return;
            }
            const arrival = buildArrivalDate(timeParts, document.getElementById('tw_as_nextday').checked);
            preview.textContent = 'Chegada calculada: ' + formatReadable(arrival);
        };

        document.getElementById('tw_as_time').addEventListener('input', refreshPreview);
        document.getElementById('tw_as_nextday').addEventListener('change', refreshPreview);
        refreshPreview();
    }

    function injectScheduler(win, payload) {
        win.__TW_AUTO_PAYLOAD__ = payload;

        const script = win.document.createElement('script');
        script.textContent = `
            (function () {
                'use strict';

                if (window.__TW_AUTO_SCHEDULER_LOADED__) return;
                window.__TW_AUTO_SCHEDULER_LOADED__ = true;

                const payload = window.__TW_AUTO_PAYLOAD__;
                if (!payload || !payload.arrivalIso) return;

                function pad(n, size = 2) {
                    return String(n).padStart(size, '0');
                }

                function fmt(ts) {
                    const d = new Date(ts);
                    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
                }

                function getDurationMs() {
                    const form = document.querySelector('#command-data-form');
                    if (!form) return null;

                    const tds = Array.from(form.querySelectorAll('td'));
                    const label = tds.find(td => td.textContent.replace(/\\s+/g, ' ').trim().includes('Duração:'));
                    if (!label || !label.nextElementSibling) return null;

                    const txt = label.nextElementSibling.textContent.trim();
                    const match = txt.match(/^(\\d{1,2}):(\\d{2}):(\\d{2})$/);
                    if (!match) return null;

                    return ((+match[1] * 3600) + (+match[2] * 60) + (+match[3])) * 1000;
                }

                function schedule() {
                    const btn = document.getElementById('troop_confirm_submit');
                    if (!btn) return false;
                    if (typeof Timing === 'undefined' || typeof Timing.getCurrentServerTime !== 'function') return false;

                    const durationMs = getDurationMs();
                    if (durationMs == null) {
                        console.log('[AUTO] Não foi possível ler a duração do comando.');
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

                    let box = document.getElementById('tw_auto_schedule_box');
                    if (!box) {
                        box = document.createElement('div');
                        box.id = 'tw_auto_schedule_box';
                        box.style.cssText = 'margin:8px 0;padding:6px;background:#d5ffce;border:1px solid #3f7f3f;font:11px Verdana;';
                        const form = document.querySelector('#command-data-form');
                        if (form) form.prepend(box);
                    }

                    box.textContent = '[AUTO] Chegada: ' + fmt(arrival.getTime()) + ' | Envio: ' + fmt(sendTime) + ' | Offset: ' + offset + 'ms';

                    btn.disabled = true;
                    btn.classList.add('btn-disabled');

                    console.log('[AUTO] Agendado. Delay:', delay, 'ms');
                    setTimeout(function () {
                        btn.click();
                    }, Math.max(0, delay));

                    return true;
                }

                const wait = setInterval(function () {
                    try {
                        if (schedule()) clearInterval(wait);
                    } catch (e) {
                        console.error('[AUTO] Erro no agendador:', e);
                        clearInterval(wait);
                    }
                }, 100);
            })();
        `;
        win.document.body.appendChild(script);
    }

    function configureWindow(win, troops, coord, payload, index) {
        const timer = setInterval(() => {
            try {
                if (!win || win.closed) {
                    clearInterval(timer);
                    return;
                }

                const doc = win.document;
                const xInput = doc.getElementById('inputx') || doc.querySelector('input[name="x"]');
                const yInput = doc.getElementById('inputy') || doc.querySelector('input[name="y"]');

                if (!xInput || !yInput) return;

                xInput.value = coord.x;
                yInput.value = coord.y;

                for (const unit in troops) {
                    const inp = doc.getElementById('unit_input_' + unit);
                    if (inp) inp.value = Number(troops[unit]) > 0 ? troops[unit] : '';
                }

                const supportBtn = doc.getElementById('target_support');
                if (!supportBtn) return;

                supportBtn.click();
                clearInterval(timer);

                setStatus(`Janela ${index + 1}: abrindo confirmação...`);

                const checkConfirm = setInterval(() => {
                    try {
                        if (!win || win.closed) {
                            clearInterval(checkConfirm);
                            return;
                        }

                        if (win.location.href.includes('try=confirm')) {
                            clearInterval(checkConfirm);
                            injectScheduler(win, payload);
                            setStatus(`Janela ${index + 1}: agendamento aplicado.`);
                        }
                    } catch (e) {}
                }, 200);
            } catch (e) {}
        }, 250);
    }

    buildPanel();

    document.getElementById('tw_as_start').onclick = function () {
        const coordInput = document.getElementById('tw_as_coord').value;
        const timeInput = document.getElementById('tw_as_time').value.trim();
        const offset = parseInt(document.getElementById('tw_as_offset').value, 10) || 0;
        const windows = Math.min(10, Math.max(1, parseInt(document.getElementById('tw_as_windows').value, 10) || 4));
        const nextDay = document.getElementById('tw_as_nextday').checked;

        const coord = parseCoord(coordInput);
        if (!coord) {
            alert('Coordenada inválida. Use 000|000');
            return;
        }

        const timeParts = parseTime(timeInput);
        if (!timeInput) {
            alert('Preencha o horário de chegada.');
            return;
        }
        if (!timeParts) {
            alert('Horário inválido. Use HH:MM:SS.mmm');
            return;
        }

        const arrival = buildArrivalDate(timeParts, nextDay);
        const payload = {
            arrivalIso: formatIsoLocal(arrival),
            offset: offset
        };

        const troops = {};
        document.querySelectorAll('.tw_as_unit').forEach(inp => {
            troops[inp.dataset.unit] = inp.value;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            units: troops,
            coord: coord.value,
            time: timeInput,
            windows,
            offset,
            nextDay
        }));
        localStorage.setItem('CS.offset', String(offset));

        setStatus(`Chegada: ${formatReadable(arrival)}`);

        let opened = 0;
        for (let i = 0; i < windows; i++) {
            const left = (i % 5) * 390;
            const top = i < 5 ? 0 : 480;
            const url = `${window.location.origin}/game.php?village=${window.game_data.village.id}&screen=place`;
            const child = window.open(url, `tw_auto_sched_${i}_${Date.now()}`, `width=460,height=600,left=${left},top=${top}`);

            if (child) {
                opened++;
                configureWindow(child, troops, coord, payload, i);
            }
        }

        setStatus(`Abrindo ${opened}/${windows} janelas | Offset ${offset}ms`);
    };
})();
