/*
 * Script Name: Planejador de Backtime ULTRA - Unificado
 * Version: v1.3.0
 * Last Updated: 2026-04-08
 * Author: RedAlert
 * Mod: Cap Caverna / Gemini
 */

if (typeof DEBUG !== 'boolean') DEBUG = false;
if (typeof MAX_INCS !== 'number') MAX_INCS = 500;
if (typeof HIDE_GREENS !== 'boolean') HIDE_GREENS = false;

var scriptConfig = {
    scriptData: {
        prefix: 'backtimesPlanner',
        name: 'Planejador de Backtime',
        version: 'v1.3.0',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink: 'https://forum.tribalwars.net/index.php?threads/backtimes-planner.291673/',
    },
    translations: {
        'en_DK': {
            'Backtimes Planner': 'Planejador de Backtime',
            'Help': 'Ajuda',
            'Redirecting...': 'Redirecionando...',
            'It seems like you have no incomings 😀': 'Parece que você não tem ataques recebidos 😀',
            'Plan Backtimes': 'Planejar Backtime',
            'Export Selected': 'Exportar Selecionados',
            'Automatic Export': 'Exportação Automática',
            'Add Return Time': 'Adicionar Hora de Retorno',
            'Tag Incomings': 'Marcar Ataques',
            'Unit': 'Unidade',
            'Incoming': 'Ataque',
            'Land Time': 'Chegada',
            'Return Time': 'Retorno',
            'Actions': 'Ações',
            'Launch Time': 'Envio',
            'Send in': 'Enviar em',
            'Send': 'Enviar',
            'Nothing has been selected!': 'Nada foi selecionado!',
            'Copied on clipboard!': 'Copiado para a área de transferência!',
            'No incoming could be selected!': 'Nenhum ataque pôde ser selecionado!',
            'All incoming commands have been renamed!': 'Todos os ataques foram renomeados!',
            'No possible backtime options found!': 'Nenhuma opção de backtime encontrada!',
            'Slowest Unit': 'Unidade Mais Lenta',
            'Travel Time': 'Tempo de Viagem',
            'Travel Time is always calculated based off the slowest unit that was sent, no matter if the unit survived or not!': 'O tempo de viagem é calculado pela unidade mais lenta.',
            'combinations found': 'combinações encontradas',
            'Attack': 'Ataque',
            'No unit survived the battle!': 'Nenhuma unidade sobreviveu à batalha!',
            'Command has already returned home!': 'O comando já retornou para a aldeia!'
        },
    },
    allowedMarkets: ['us', 'en', 'br', 'pt'],
    allowedScreens: ['overview_villages', 'report'],
    allowedModes: ['incomings'],
    isDebug: DEBUG,
    enableCountApi: true,
};

window.twSDK = {
    scriptData: scriptConfig.scriptData,
    translations: scriptConfig.translations,
    market: game_data.market,
    units: game_data.units,
    village: game_data.village,
    sitterId: game_data.player.sitter > 0 ? `&t=${game_data.player.id}` : '',
    coordsRegex: /\d{1,3}\|\d{1,3}/g,
    unitInfoInterface: '/interface.php?func=get_unit_info',

    _initDebug: function () {
        if (DEBUG) console.debug(`[${this.scriptData.name}] Inicializado.`);
    },

    addGlobalStyle: function () {
        return `
            .ra-ultra-wrap { color: #2c2115; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; }
            .ra-ultra-topbar, .ra-ultra-panel, .ra-ultra-results { 
                background: linear-gradient(180deg, #fbf5e8 0%, #edd8af 100%);
                border: 1px solid #c9a86b; border-radius: 14px; padding: 14px; margin-bottom: 15px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .ra-ultra-topbar { display: flex; justify-content: space-between; align-items: center; }
            .ra-ultra-brand { display: flex; align-items: center; gap: 12px; }
            .ra-ultra-brand-badge { 
                width: 50px; height: 50px; background: #a61f1f; color: #fff; 
                display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;
                box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
            }
            .ra-ultra-top-stats { display: flex; gap: 10px; }
            .ra-ultra-top-stat { background: rgba(255,255,255,0.4); padding: 5px 10px; border-radius: 8px; text-align: center; border: 1px solid #d0b27a; }
            .ra-ultra-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .ra-table-v3 { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .ra-table-v3 th { background: #c79f59; padding: 8px; border: 1px solid #b88d49; font-size: 11px; text-transform: uppercase; }
            .ra-table-v3 td { padding: 8px; border: 1px solid #d8bd87; text-align: center; background: rgba(255,255,255,0.5); }
            .ra-ultra-btn { border-radius: 8px !important; padding: 8px 12px !important; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
            .ra-ultra-btn-primary { background: #1f7a1f; color: white !important; }
            .timer { font-weight: bold; color: #a61f1f; font-family: monospace; font-size: 1.1em; }
            .ra-unit-selector { transform: scale(1.2); }
            .ra-live-timer { background: #fff; padding: 2px 5px; border-radius: 4px; border: 1px solid #c9a86b; }
        `;
    },

    calculateDistance: function (from, to) {
        const [x1, y1] = from.split('|').map(Number);
        const [x2, y2] = to.split('|').map(Number);
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    },

    getServerDateTimeObject: function () {
        const serverTime = jQuery('#serverTime').text();
        const serverDate = jQuery('#serverDate').text();
        const [day, month, year] = serverDate.split('/').map(Number);
        return new Date(year, month - 1, day, ...serverTime.split(':').map(Number));
    },

    getWorldUnitInfo: async function () {
        const response = await jQuery.ajax({ url: this.unitInfoInterface });
        return this.xml2json(jQuery(response));
    },

    xml2json: function ($xml) {
        let data = {};
        const _self = this;
        $.each($xml.children(), function () {
            let $this = $(this);
            if ($this.children().length > 0) data[$this.prop('tagName')] = _self.xml2json($this);
            else data[$this.prop('tagName')] = $.trim($this.text());
        });
        return data;
    },

    renderBoxWidget: function (body, id, mainClass, customStyle) {
        const content = `<div id="${id}" class="${mainClass}"><style>${this.addGlobalStyle()}${customStyle}</style>${body}</div>`;
        jQuery('#contentContainer').prepend(content);
    },

    getTimeFromString: function (timeStr) {
        if (!timeStr) return null;
        const serverDateText = jQuery('#serverDate').text();
        const [day, month, year] = serverDateText.split('/').map(Number);
        let baseDate = new Date(year, month - 1, day);
        const timeMatch = timeStr.match(/\d{2}:\d{2}:\d{2}/);
        if (!timeMatch) return null;
        const [h, m, s] = timeMatch[0].split(':').map(Number);
        if (timeStr.includes('amanhã') || timeStr.includes('tomorrow')) baseDate.setDate(baseDate.getDate() + 1);
        baseDate.setHours(h, m, s, 0);
        return baseDate;
    },

    getTravelTimeInSecond: function (dist, speed) { return dist * speed * 60; },

    formatDateTime: function (date) { return new Date(date).toLocaleString('pt-BR'); },

    secondsToHms: function (sec) {
        if (sec <= 0) return "00:00:00";
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    },

    tt: function (str) { return this.translations['en_DK'][str] || str; },
    
    buildUnitsPicker: function (selected, ignore) {
        let html = '<div style="display:flex; gap:10px; flex-wrap:wrap; background:rgba(255,255,255,0.3); padding:10px; border-radius:10px; border:1px solid #d0b27a;">';
        this.units.forEach(u => {
            if (!ignore.includes(u)) {
                const checked = selected.includes(u) ? 'checked' : '';
                html += `<div style="text-align:center;"><label style="cursor:pointer;"><img src="/graphic/unit/unit_${u}.png"><br><input type="checkbox" class="ra-unit-selector" value="${u}" ${checked}></label></div>`;
            }
        });
        return html + '</div>';
    }
};

/* --- FUNÇÕES DE LÓGICA E FILTRO --- */

function saveResultFilters() {
    const filters = {
        unit: jQuery('#raFilterUnit').val() || '',
        onlyViable: jQuery('#raOnlyViable').is(':checked'),
        hideLost: jQuery('#raHideLost').is(':checked'),
    };
    localStorage.setItem('ra_result_filters', JSON.stringify(filters));
}

function applySavedFilters() {
    try {
        const saved = JSON.parse(localStorage.getItem('ra_result_filters'));
        if (!saved) return;
        if (saved.unit) jQuery('#raFilterUnit').val(saved.unit);
        jQuery('#raOnlyViable').prop('checked', !!saved.onlyViable);
        jQuery('#raHideLost').prop('checked', !!saved.hideLost);
    } catch (e) {}
}

let raTimerInterval = null;
function startLiveCountdown() {
    if (raTimerInterval) clearInterval(raTimerInterval);
    raTimerInterval = setInterval(() => {
        jQuery('.ra-live-timer').each(function () {
            let secs = parseInt(jQuery(this).attr('data-seconds'), 10);
            if (isNaN(secs) || secs <= 0) {
                jQuery(this).text("00:00:00");
                return;
            }
            secs--;
            jQuery(this).attr('data-seconds', secs);
            jQuery(this).text(window.twSDK.secondsToHms(secs));
        });
    }, 1000);
}

function renderFilteredResults(results) {
    const selectedUnit = jQuery('#raFilterUnit').val();
    const onlyViable = jQuery('#raOnlyViable').is(':checked');
    const hideLost = jQuery('#raHideLost').is(':checked');

    let filtered = [...results];
    if (selectedUnit) filtered = filtered.filter(r => r.unit === selectedUnit);
    if (onlyViable) filtered = filtered.filter(r => r.secondsUntilLaunch > 30);
    else if (hideLost) filtered = filtered.filter(r => r.secondsUntilLaunch >= 0);

    filtered.sort((a, b) => {
        const score = (item) => {
            if (item.secondsUntilLaunch < 0) return -999999;
            return -Math.abs(item.secondsUntilLaunch);
        };
        return score(b) - score(a);
    });

    if (!filtered.length) {
        jQuery('#raPossibleCombinationsTable').html('<p style="padding:10px;">Nenhuma combinação com estes filtros.</p>');
        return;
    }

    const bestResult = filtered.find(r => r.secondsUntilLaunch >= 0);
    let html = `<table class="ra-table-v3"><thead><tr><th>Status</th><th>Ataque</th><th>Unidade</th><th>Distância</th><th>Chegada</th><th>Envio</th><th>Tempo Restante</th></tr></thead><tbody>`;

    filtered.forEach((r) => {
        let statusColor = '#a61f1f';
        let rowBg = 'rgba(166, 31, 31, 0.08)';
        let statusText = 'perdido';

        if (r.secondsUntilLaunch > 30) {
            statusColor = '#1f7a1f';
            rowBg = 'rgba(31, 122, 31, 0.10)';
            statusText = 'viável';
        } else if (r.secondsUntilLaunch >= 0) {
            statusColor = '#a66a00';
            rowBg = 'rgba(166, 106, 0, 0.10)';
            statusText = 'janela curta';
        }

        const isBest = bestResult && r === bestResult;
        const bestBadge = isBest ? '<div style="font-size:10px;font-weight:bold;color:#1f7a1f;">MELHOR OPÇÃO</div>' : '';

        html += `<tr style="background:${rowBg};">
            <td><strong style="color:${statusColor};">${statusText}</strong></td>
            <td>${bestBadge}${r.label}</td>
            <td><img src="/graphic/unit/unit_${r.unit}.png"> <div>${r.unit}</div></td>
            <td>${r.distance.toFixed(2)}</td>
            <td>${r.landTime}</td>
            <td>${window.twSDK.formatDateTime(r.launchTime)}</td>
            <td><span class="timer ra-live-timer" data-seconds="${Math.max(0, r.secondsUntilLaunch)}">${window.twSDK.secondsToHms(r.secondsUntilLaunch)}</span></td>
        </tr>`;
    });
    jQuery('#raPossibleCombinationsTable').html(html + `</tbody></table>`);
}

(async function () {
    const worldData = await twSDK.getWorldUnitInfo();
    const unitConfig = worldData.config;

    async function initializeIncomingsOverviewScreen() {
        if (parseInt(game_data.player.incomings) === 0) {
            UI.InfoMessage(twSDK.tt('It seems like you have no incomings 😀'));
            return;
        }
        const incomings = collectIncomingsList();
        buildUI(incomings);
    }

    function collectIncomingsList() {
        const list = [];
        jQuery('#incomings_table tr.nowrap').each(function () {
            const $row = jQuery(this);
            const label = $row.find('.quickedit-label').text().trim();
            const id = $row.find('.quickedit').attr('data-id');
            const landTimeStr = $row.find('td:eq(5)').text().trim();
            const originMatch = $row.find('td:eq(2)').text().match(/\d{1,3}\|\d{1,3}/);
            const origin = originMatch ? originMatch[0] : '000|000';
            list.push({ incomingId: id, label: label, origin: origin, landTime: landTimeStr });
        });
        return list;
    }

    function buildUI(incomings) {
        const picker = twSDK.buildUnitsPicker(['axe', 'light', 'ram', 'catapult'], ['spy', 'snob', 'militia', 'knight']);
        
        const body = `
            <div class="ra-ultra-wrap">
                <div class="ra-ultra-topbar">
                    <div class="ra-ultra-brand">
                        <div class="ra-ultra-brand-badge">ULTRA</div>
                        <div>
                            <div style="font-size:20px; font-weight:bold;">${twSDK.tt('Backtimes Planner')}</div>
                            <div style="font-size:11px; color:#6d583c;">Painel Premium Ativo</div>
                        </div>
                    </div>
                    <div class="ra-ultra-top-stats">
                        <div class="ra-ultra-top-stat">Ataques: <strong>${incomings.length}</strong></div>
                        <div class="ra-ultra-top-stat">Aldeia: <strong>${game_data.village.x}|${game_data.village.y}</strong></div>
                    </div>
                </div>

                <div class="ra-ultra-grid">
                    <div class="ra-ultra-panel">
                        <h4 style="margin-top:0;">1. Selecione as Unidades</h4>
                        ${picker}
                    </div>
                    <div class="ra-ultra-panel">
                        <h4 style="margin-top:0;">2. Ações</h4>
                        <button class="btn ra-ultra-btn ra-ultra-btn-primary" id="raPlanBacktimesBtn" style="width:100%; margin-bottom:10px;">CALCULAR BACKTIMES</button>
                        <div style="font-size:11px; color:#6b573a;">O script cruzará os dados dos ataques selecionados com a velocidade das suas tropas.</div>
                    </div>
                </div>

                <div class="ra-ultra-panel">
                    <h4 style="margin-top:0;">3. Ataques Recebidos</h4>
                    <div style="max-height:300px; overflow-y:auto; border:1px solid #d0b27a; border-radius:8px;">
                        <table class="ra-table-v3">
                            <thead><tr><th><input type="checkbox" id="raMasterToggle" checked></th><th>Ataque</th><th>Origem</th><th>Chegada</th></tr></thead>
                            <tbody>
                                ${incomings.map(i => `<tr><td><input type="checkbox" class="ra-select-toggle" value="${i.incomingId}" checked></td><td>${i.label}</td><td>${i.origin}</td><td>${i.landTime}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="raSnipes" style="display:none;" class="ra-ultra-results">
                    <h4 style="margin-top:0;">4. Resultados e Filtros</h4>
                    <div style="margin-bottom:15px; display:flex; gap:15px; align-items:center; background:rgba(255,255,255,0.4); padding:10px; border-radius:8px;">
                        <label>Unidade: <select id="raFilterUnit"><option value="">Todas</option></select></label>
                        <label><input type="checkbox" id="raOnlyViable"> Só viáveis</label>
                        <label><input type="checkbox" id="raHideLost" checked> Ocultar perdidos</label>
                    </div>
                    <div id="raPossibleCombinationsTable"></div>
                </div>
            </div>
        `;
        
        twSDK.renderBoxWidget(body, 'ra-planner', 'ra-ultra-wrap', '');

        jQuery('#raMasterToggle').click(function() {
            jQuery('.ra-select-toggle').prop('checked', this.checked);
        });
        
        jQuery('#raPlanBacktimesBtn').click(async () => {
            const selUnits = [];
            jQuery('.ra-unit-selector:checked').each(function() { selUnits.push(jQuery(this).val()); });
            const selIncs = [];
            jQuery('.ra-select-toggle:checked').each(function() { selIncs.push(jQuery(this).val()); });

            if (!selUnits.length || !selIncs.length) {
                UI.ErrorMessage("Selecione tropas e ataques.");
                return;
            }

            const filtered = incomings.filter(i => selIncs.includes(String(i.incomingId)));
            const serverNow = twSDK.getServerDateTimeObject();
            const results = [];

            filtered.forEach(inc => {
                const landing = twSDK.getTimeFromString(inc.landTime);
                if (!landing) return;
                selUnits.forEach(u => {
                    const speed = unitConfig[u].speed;
                    const dist = twSDK.calculateDistance(`${game_data.village.x}|${game_data.village.y}`, inc.origin);
                    const travel = twSDK.getTravelTimeInSecond(dist, parseFloat(speed));
                    const launch = new Date(landing.getTime() - (travel * 1000));
                    const diff = Math.floor((launch.getTime() - serverNow.getTime()) / 1000);
                    results.push({ ...inc, unit: u, distance: dist, launchTime: launch, secondsUntilLaunch: diff });
                });
            });

            window.raLastResults = results;
            jQuery('#raSnipes').show();
            const unitsFound = [...new Set(results.map(r => r.unit))].sort();
            jQuery('#raFilterUnit').html('<option value="">Todas</option>' + unitsFound.map(u => `<option value="${u}">${u}</option>`).join(''));
            
            applySavedFilters();
            renderFilteredResults(results);
            startLiveCountdown();

            jQuery('#raFilterUnit, #raOnlyViable, #raHideLost').off('change').on('change', () => {
                saveResultFilters();
                renderFilteredResults(window.raLastResults);
            });
            UI.SuccessMessage("Backtimes calculados!");
        });
    }

    const screen = new URLSearchParams(window.location.search).get('screen');
    if (screen === 'report') {
        // Logica simplificada para relatórios
        UI.InfoMessage("Abra a visão geral de ataques para o planejador completo.");
    } else {
        initializeIncomingsOverviewScreen();
    }
})();
