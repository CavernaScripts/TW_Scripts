(function () {
    'use strict';

    const APP = {
        version: 'v6-premium',
        ids: {
            style: 'mcv6-style',
            header: 'mcv6-th',
            panel: 'mcv6-panel',
            row1: 'mcv6_modelo_1',
            row2: 'mcv6_modelo_2',
            loopKey: '__mcv6_loop__'
        },
        cls: {
            btn: 'mcv6-btn',
            btnPlus: 'mcv6-btn-plus',
            btnRun: 'mcv6-btn-run',
            btnStop: 'mcv6-btn-stop',
            btnMini: 'mcv6-btn-mini',
            input: 'mcv6-input',
            icon: 'mcv6-icon',
            working: 'is-working',
            ok: 'is-ok',
            err: 'is-err',
            queued: 'is-queued',
            doneRow: 'mcv6-row-done'
        },
        cfg: {
            axe: 50,
            ram: 10,
            timeoutMs: 20000,
            checkMs: 350,
            scanMs: 2200,
            autoCloseMs: 350
        },
        state: {
            queue: [],
            running: false,
            stopRequested: false,
            current: null
        }
    };

    function ok(msg, ms) {
        try { UI.SuccessMessage(msg, ms || 2000); }
        catch (e) { console.log(msg); }
    }

    function err(msg, ms) {
        try { UI.ErrorMessage(msg, ms || 3000); }
        catch (e) { console.error(msg); }
    }

    function log() {
        console.log('[Derruba Muralha]', ...arguments);
    }

    function q(sel, root) {
        return (root || document).querySelector(sel);
    }

    function qa(sel, root) {
        return Array.from((root || document).querySelectorAll(sel));
    }

    function injectStyle() {
        if (document.getElementById(APP.ids.style)) return;

        const css = document.createElement('style');
        css.id = APP.ids.style;
        css.textContent = `
            .${APP.cls.btn},
            .${APP.cls.btnPlus},
            .${APP.cls.btnRun},
            .${APP.cls.btnStop},
            .${APP.cls.btnMini} {
                display:inline-block;
                min-width:22px;
                height:22px;
                line-height:20px;
                padding:0 6px;
                margin:0 1px;
                background:linear-gradient(to bottom,#f8e6b6 0%,#d7b574 100%);
                color:#3b240b !important;
                border:1px solid #7d510f;
                border-radius:3px;
                text-decoration:none !important;
                cursor:pointer;
                font-weight:bold;
                font-size:11px;
                text-align:center;
                box-sizing:border-box;
                user-select:none;
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,.55),
                    0 1px 1px rgba(0,0,0,.18);
            }

            .${APP.cls.btn}:hover,
            .${APP.cls.btnPlus}:hover,
            .${APP.cls.btnRun}:hover,
            .${APP.cls.btnStop}:hover,
            .${APP.cls.btnMini}:hover {
                background:linear-gradient(to bottom,#fff0c7 0%,#e2c182 100%);
                color:#2a1707 !important;
            }

            .${APP.cls.btn}.${APP.cls.working},
            .${APP.cls.btnPlus}.${APP.cls.working},
            .${APP.cls.btnMini}.${APP.cls.working} {
                background:linear-gradient(to bottom,#d9d9d9 0%,#bdbdbd 100%) !important;
                color:#444 !important;
                cursor:wait !important;
                pointer-events:none !important;
            }

            .${APP.cls.btn}.${APP.cls.ok},
            .${APP.cls.btnPlus}.${APP.cls.ok},
            .${APP.cls.btnMini}.${APP.cls.ok} {
                background:linear-gradient(to bottom,#dff4cf 0%,#9fd17d 100%) !important;
                color:#214411 !important;
                border-color:#5f8f43 !important;
            }

            .${APP.cls.btn}.${APP.cls.err},
            .${APP.cls.btnPlus}.${APP.cls.err},
            .${APP.cls.btnMini}.${APP.cls.err} {
                background:linear-gradient(to bottom,#f7d6d6 0%,#d98e8e 100%) !important;
                color:#5a1616 !important;
                border-color:#9b4f4f !important;
            }

            .${APP.cls.btn}.${APP.cls.queued},
            .${APP.cls.btnPlus}.${APP.cls.queued},
            .${APP.cls.btnMini}.${APP.cls.queued} {
                background:linear-gradient(to bottom,#d8e8f8 0%,#8db1da 100%) !important;
                color:#183a61 !important;
                border-color:#5f82ac !important;
            }

            .${APP.cls.input} {
                width:42px !important;
                height:20px;
                text-align:center;
                border:1px solid #7d510f;
                background:#f4e4bc;
                color:#3b240b;
                font-weight:bold;
                box-sizing:border-box;
            }

            .${APP.cls.icon} {
                display:inline-block;
                width:22px;
                height:22px;
                background:linear-gradient(to bottom,#f8e6b6 0%,#d7b574 100%);
                color:#3b240b;
                font-weight:bold;
                line-height:22px;
                text-align:center;
                border:1px solid #7d510f;
                border-radius:3px;
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,.55),
                    0 1px 1px rgba(0,0,0,.18);
            }

            #${APP.ids.panel} {
                position:fixed;
                right:12px;
                bottom:12px;
                z-index:999999;
                width:255px;
                background:linear-gradient(to bottom,#f4e4bc 0%,#e3c98f 100%);
                border:2px solid #7d510f;
                border-radius:6px;
                box-shadow:0 5px 18px rgba(0,0,0,.35);
                padding:10px;
                font-family:Verdana,Arial,sans-serif;
                color:#3b240b;
            }

            #${APP.ids.panel} .mcv6-title {
                font-weight:bold;
                font-size:13px;
                margin-bottom:8px;
                display:flex;
                justify-content:space-between;
                align-items:center;
                padding-bottom:5px;
                border-bottom:1px solid rgba(61,36,11,.22);
            }

            #${APP.ids.panel} .mcv6-grid {
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:6px;
                font-size:11px;
                margin-bottom:8px;
            }

            #${APP.ids.panel} .mcv6-line {
                font-size:11px;
                margin:4px 0;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            }

            #${APP.ids.panel} .mcv6-actions {
                display:flex;
                gap:6px;
                flex-wrap:wrap;
                margin-top:8px;
            }

            tr.${APP.cls.doneRow} {
                opacity:.50;
                transition:opacity .2s ease;
            }

            tr.mcv6-row-queued {
                box-shadow: inset 3px 0 0 #5f82ac;
            }

            tr.mcv6-row-running {
                box-shadow: inset 3px 0 0 #7d510f;
                background:rgba(255,240,190,.35) !important;
            }
        `;
        document.head.appendChild(css);
    }

    function unitsAvailable() {
        const units = Array.isArray(window.game_data?.units) ? window.game_data.units : [];
        return {
            archer: units.includes('archer'),
            marcher: units.includes('marcher')
        };
    }

    function getModelTable() {
        return q('form[action*="am_farm"][action*="edit_all"] table.vis tbody')
            || q('form table.vis tbody');
    }

    function buildModelM() {
        if (document.getElementById(APP.ids.row1) || document.getElementById(APP.ids.row2)) return;

        const tbody = getModelTable();
        if (!tbody) {
            log('Tabela de modelos não encontrada.');
            return;
        }

        const available = unitsAvailable();
        const units = [
            { key: 'spear', img: 'unit_spear.png', enabled: false, value: 0 },
            { key: 'sword', img: 'unit_sword.png', enabled: false, value: 0 },
            { key: 'axe', img: 'unit_axe.png', enabled: true, value: APP.cfg.axe },
            ...(available.archer ? [{ key: 'archer', img: 'unit_archer.png', enabled: false, value: 0 }] : []),
            { key: 'spy', img: 'unit_spy.png', enabled: false, value: 0 },
            { key: 'light', img: 'unit_light.png', enabled: false, value: 0 },
            ...(available.marcher ? [{ key: 'marcher', img: 'unit_marcher.png', enabled: false, value: 0 }] : []),
            { key: 'heavy', img: 'unit_heavy.png', enabled: false, value: 0 },
            { key: 'ram', img: 'unit_ram.png', enabled: true, value: APP.cfg.ram },
            { key: 'catapult', img: 'unit_catapult.png', enabled: false, value: 0 }
        ];

        const tr1 = document.createElement('tr');
        tr1.id = APP.ids.row1;
        let h1 = `<td rowspan="2" align="center" width="10%"><span class="${APP.cls.icon}">M</span></td>`;
        units.forEach(u => {
            h1 += `<th style="text-align:center" width="35"><img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/${u.img}"></th>`;
        });
        h1 += `<th style="text-align:center" width="10%"><img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/vignette/res.png"></th><th></th>`;
        tr1.innerHTML = h1;

        const tr2 = document.createElement('tr');
        tr2.id = APP.ids.row2;
        let h2 = '';
        units.forEach(u => {
            if (u.enabled) {
                h2 += `<td align="center"><input id="cfg_m_as_${u.key}" type="text" value="${u.value}" class="${APP.cls.input}" size="3"></td>`;
            } else {
                h2 += `<td align="center"><input type="text" value="0" class="${APP.cls.input}" size="3" disabled style="opacity:.3"></td>`;
            }
        });
        h2 += `<td></td><td></td>`;
        tr2.innerHTML = h2;

        tbody.appendChild(tr1);
        tbody.appendChild(tr2);
    }

    function getCfg(name, fallback) {
        const el = document.getElementById(`cfg_m_as_${name}`);
        if (!el) return String(fallback);
        const v = String(el.value || '').trim();
        if (!v || isNaN(Number(v))) return String(fallback);
        return String(Math.max(0, Number(v)));
    }

    function getPlunderTable() {
        return document.getElementById('plunder_list');
    }

    function ensureHeader(table) {
        if (!table) return;
        if (document.getElementById(APP.ids.header)) return;

        const header = table.rows && table.rows[0];
        if (!header) return;

        const th = document.createElement('th');
        th.id = APP.ids.header;
        th.style.textAlign = 'center';
        th.textContent = 'M';

        if (header.cells.length > 0) {
            header.insertBefore(th, header.cells[header.cells.length - 1]);
        } else {
            header.appendChild(th);
        }
    }

    function extractCoords(row) {
        const list = [];
        const report = q('a[href*="screen=report"]', row);
        if (report?.textContent) list.push(report.textContent);
        if (row?.textContent) list.push(row.textContent);

        for (const txt of list) {
            const m = txt.match(/\b\d{3}\|\d{3}\b/);
            if (m) return m[0];
        }
        return null;
    }

    function setBtn(btn, state, text) {
        if (!btn) return;
        btn.classList.remove(APP.cls.working, APP.cls.ok, APP.cls.err, APP.cls.queued);
        if (state === 'working') btn.classList.add(APP.cls.working);
        if (state === 'ok') btn.classList.add(APP.cls.ok);
        if (state === 'err') btn.classList.add(APP.cls.err);
        if (state === 'queued') btn.classList.add(APP.cls.queued);
        btn.textContent = text;
    }

    function resetBtnLater(btn, ms) {
        setTimeout(() => {
            if (!btn) return;
            if (btn.dataset.running === '1') return;
            if (btn.dataset.queued === '1') return;
            setBtn(btn, '', 'M');
        }, ms || 2200);
    }

    function ensurePanel() {
        let panel = document.getElementById(APP.ids.panel);
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = APP.ids.panel;
        panel.innerHTML = `
            <div class="mcv6-title">
                <span>Derruba Muralha</span>
                <a href="javascript:void(0)" id="mcv6-close" class="${APP.cls.btnMini}">×</a>
            </div>
            <div class="mcv6-grid">
                <div><b>Fila:</b> <span id="mcv6-q">0</span></div>
                <div><b>Status:</b> <span id="mcv6-status">pronto</span></div>
                <div><b>Axe:</b> <span id="mcv6-axe">${APP.cfg.axe}</span></div>
                <div><b>Ram:</b> <span id="mcv6-ram">${APP.cfg.ram}</span></div>
            </div>
            <div class="mcv6-line"><b>Atual:</b> <span id="mcv6-current">-</span></div>
            <div class="mcv6-line"><b>Último:</b> <span id="mcv6-last">-</span></div>
            <div class="mcv6-actions">
                <a href="javascript:void(0)" id="mcv6-run" class="${APP.cls.btnRun}">Rodar fila</a>
                <a href="javascript:void(0)" id="mcv6-stop" class="${APP.cls.btnStop}">Parar</a>
                <a href="javascript:void(0)" id="mcv6-clear" class="${APP.cls.btnMini}">Limpar fila</a>
            </div>
        `;
        document.body.appendChild(panel);

        q('#mcv6-close', panel).addEventListener('click', function () {
            panel.remove();
        });

        q('#mcv6-run', panel).addEventListener('click', function () {
            processQueue();
        });

        q('#mcv6-stop', panel).addEventListener('click', function () {
            APP.state.stopRequested = true;
            updatePanel({ status: 'parando...' });
        });

        q('#mcv6-clear', panel).addEventListener('click', function () {
            clearQueue();
        });

        return panel;
    }

    function updatePanel(data) {
        ensurePanel();

        const qEl = document.getElementById('mcv6-q');
        const sEl = document.getElementById('mcv6-status');
        const cEl = document.getElementById('mcv6-current');
        const lEl = document.getElementById('mcv6-last');
        const aEl = document.getElementById('mcv6-axe');
        const rEl = document.getElementById('mcv6-ram');

        if (qEl) qEl.textContent = String(APP.state.queue.length);
        if (sEl && data?.status != null) sEl.textContent = data.status;
        if (cEl && data?.current != null) cEl.textContent = data.current;
        if (lEl && data?.last != null) lEl.textContent = data.last;
        if (aEl) aEl.textContent = getCfg('axe', APP.cfg.axe);
        if (rEl) rEl.textContent = getCfg('ram', APP.cfg.ram);
    }

    function clearQueue() {
        APP.state.queue.forEach(item => {
            if (item?.btn) {
                item.btn.dataset.queued = '0';
                if (item.btn.dataset.running !== '1') setBtn(item.btn, '', 'M');
            }
            if (item?.row) {
                item.row.classList.remove('mcv6-row-queued');
            }
        });
        APP.state.queue = [];
        updatePanel({ status: APP.state.running ? 'executando' : 'fila limpa' });
    }

    function rowAlreadyDone(row) {
        return row.classList.contains(APP.cls.doneRow) || row.dataset.mDone === '1';
    }

    function markRowDone(row) {
        row.dataset.mDone = '1';
        row.classList.add(APP.cls.doneRow);
    }

    function inQueueByCoords(coords) {
        return APP.state.queue.some(item => item.coords === coords);
    }

    function queueItem(coords, btn, row) {
        if (!coords || !btn || !row) return;
        if (rowAlreadyDone(row)) return;
        if (btn.dataset.running === '1') return;
        if (btn.dataset.queued === '1') return;
        if (inQueueByCoords(coords)) return;

        APP.state.queue.push({ coords, btn, row });
        btn.dataset.queued = '1';
        setBtn(btn, 'queued', 'M');
        row.classList.add('mcv6-row-queued');
        updatePanel({ status: APP.state.running ? 'executando' : 'em fila' });
    }

    function cleanupWin(win) {
        try { if (win && !win.closed) win.close(); } catch (e) {}
    }

    function fillAttack(doc, coords, axe, ram) {
        const targetInput =
            q('input.target-input-field', doc) ||
            q('input[name="input"]', doc) ||
            q('input[name="x"]', doc);

        const axeInput = doc.getElementById('unit_input_axe');
        const ramInput = doc.getElementById('unit_input_ram');

        const attackBtn =
            doc.getElementById('target_attack') ||
            q('input[type="submit"]', doc) ||
            q('button[type="submit"]', doc);

        if (!targetInput || !axeInput || !ramInput || !attackBtn) return false;

        targetInput.value = coords;
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));

        axeInput.value = axe;
        axeInput.dispatchEvent(new Event('input', { bubbles: true }));
        axeInput.dispatchEvent(new Event('change', { bubbles: true }));

        ramInput.value = ram;
        ramInput.dispatchEvent(new Event('input', { bubbles: true }));
        ramInput.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            try { attackBtn.click(); }
            catch (e) { log('Erro no clique de atacar:', e); }
        }, 160);

        return true;
    }

    function clickConfirm(doc) {
        const confirm =
            doc.getElementById('troop_confirm_submit') ||
            q('#command-confirm-form input[type="submit"]', doc) ||
            q('input[type="submit"][name="submit_confirm"]', doc);

        if (!confirm) return false;
        confirm.click();
        return true;
    }

    function executeItem(item) {
        return new Promise(resolve => {
            const { coords, btn, row } = item;

            if (!coords || !btn || !row) {
                resolve({ ok: false, coords: '-', reason: 'item inválido' });
                return;
            }

            row.classList.remove('mcv6-row-queued');
            row.classList.add('mcv6-row-running');

            if (rowAlreadyDone(row)) {
                btn.dataset.queued = '0';
                setBtn(btn, 'ok', 'OK');
                row.classList.remove('mcv6-row-running');
                resolve({ ok: true, coords, reason: 'já concluído' });
                return;
            }

            const villageId = window.game_data?.village?.id;
            if (!villageId) {
                btn.dataset.queued = '0';
                btn.dataset.running = '0';
                setBtn(btn, 'err', 'ERR');
                row.classList.remove('mcv6-row-running');
                resolve({ ok: false, coords, reason: 'sem village id' });
                return;
            }

            const axe = getCfg('axe', APP.cfg.axe);
            const ram = getCfg('ram', APP.cfg.ram);

            btn.dataset.queued = '0';
            btn.dataset.running = '1';
            setBtn(btn, 'working', '...');

            updatePanel({
                status: 'executando',
                current: coords
            });

            const win = window.open(`/game.php?village=${villageId}&screen=place`, 'ataque_m_v6', 'width=520,height=650');

            if (!win) {
                btn.dataset.running = '0';
                setBtn(btn, 'err', 'POP');
                row.classList.remove('mcv6-row-running');
                resolve({ ok: false, coords, reason: 'popup bloqueado' });
                return;
            }

            let done = false;
            let sent = false;
            const started = Date.now();

            const finish = (success, reason) => {
                if (done) return;
                done = true;
                clearInterval(timer);

                row.classList.remove('mcv6-row-running');
                row.classList.remove('mcv6-row-queued');

                if (success) {
                    setBtn(btn, 'ok', 'OK');
                    markRowDone(row);
                    cleanupWin(win);
                } else {
                    setBtn(btn, 'err', 'ERR');
                    cleanupWin(win);
                    resetBtnLater(btn, 2600);
                }

                btn.dataset.running = '0';

                resolve({
                    ok: !!success,
                    coords,
                    reason: reason || (success ? 'ok' : 'falha')
                });
            };

            const timer = setInterval(() => {
                try {
                    if (APP.state.stopRequested) {
                        finish(false, 'parado');
                        return;
                    }

                    if (Date.now() - started > APP.cfg.timeoutMs) {
                        finish(false, 'timeout');
                        return;
                    }

                    if (!win || win.closed) {
                        finish(false, 'janela fechada');
                        return;
                    }

                    const doc = win.document;
                    if (!doc || !doc.body) return;

                    if (clickConfirm(doc)) {
                        setTimeout(() => finish(true, 'confirmado'), APP.cfg.autoCloseMs);
                        return;
                    }

                    if (!sent) {
                        const loaded = fillAttack(doc, coords, axe, ram);
                        if (loaded) sent = true;
                    }
                } catch (e) {
                    log('Erro na execução:', e);
                }
            }, APP.cfg.checkMs);
        });
    }

    async function processQueue() {
        if (APP.state.running) return;
        APP.state.running = true;
        APP.state.stopRequested = false;

        updatePanel({
            status: APP.state.queue.length ? 'executando' : 'fila vazia',
            current: '-'
        });

        while (APP.state.queue.length) {
            if (APP.state.stopRequested) break;

            const item = APP.state.queue.shift();
            updatePanel({ status: 'executando' });

            if (!item) continue;

            const result = await executeItem(item);

            APP.state.current = result.coords;
            updatePanel({
                status: APP.state.stopRequested ? 'parando...' : 'executando',
                current: APP.state.queue.length ? APP.state.queue[0]?.coords || '-' : '-',
                last: `${result.coords} - ${result.ok ? 'OK' : result.reason}`
            });
        }

        const stopped = APP.state.stopRequested;
        APP.state.running = false;
        APP.state.stopRequested = false;
        updatePanel({
            status: stopped ? 'parado' : 'pronto',
            current: '-'
        });
    }

    function createMainButton(coords, row) {
        const a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.className = APP.cls.btn;
        a.innerHTML = 'M';
        a.title = `Executar Derruba Muralha em ${coords}`;
        a.addEventListener('click', function (ev) {
            ev.preventDefault();
            if (a.dataset.running === '1') return;
            if (a.dataset.queued === '1') return;
            queueItem(coords, a, row);
            processQueue();
        });
        return a;
    }

    function createQueueButton(coords, row, mainBtn) {
        const a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.className = APP.cls.btnPlus;
        a.innerHTML = '+';
        a.title = `Adicionar ${coords} à fila`;
        a.addEventListener('click', function (ev) {
            ev.preventDefault();
            queueItem(coords, mainBtn, row);
        });
        return a;
    }

    function scanRows() {
        const table = getPlunderTable();
        if (!table) return;

        ensureHeader(table);

        qa('tr[id^="village_"]', table).forEach(row => {
            if (row.dataset.mInit === '1') return;

            const coords = extractCoords(row);
            row.dataset.mInit = '1';

            if (!coords) return;

            const cellIndex = Math.max(0, row.cells.length - 1);
            const cell = row.insertCell(cellIndex);
            cell.style.textAlign = 'center';

            const btnMain = createMainButton(coords, row);
            const btnQueue = createQueueButton(coords, row, btnMain);

            cell.appendChild(btnMain);
            cell.appendChild(btnQueue);
        });
    }

    function startLoop() {
        if (window[APP.ids.loopKey]) clearInterval(window[APP.ids.loopKey]);
        window[APP.ids.loopKey] = setInterval(function () {
            try {
                scanRows();
                updatePanel();
            } catch (e) {
                log('Erro no loop:', e);
            }
        }, APP.cfg.scanMs);
    }

    injectStyle();
    buildModelM();
    scanRows();
    ensurePanel();
    updatePanel({ status: 'pronto', current: '-', last: '-' });
    startLoop();

    ok('Derruba Muralha carregado.', 2200);
})();
