// ==UserScript==
// @name         Ultimate Pack Premiun V4.1
// @namespace    @cap_caverna
// @version      4.1.0
// @description  Barra Dupla Centralizada: Atalhos Fixos + Hub e Scripts Instalados abaixo.
// @author       Cap Caverna
// @match        https://*.tribalwars.com.br/game.php?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tribalwars.com.br
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const scriptsHub = [
        { n: "Coleta", c: "$.getScript('https://cdn.jsdelivr.net/gh/CavernaScripts/TW_Scripts@main/Coleta.js');" },
        { n: "Coleta em massa", c: "$.getScript('https://cdn.jsdelivr.net/gh/CavernaScripts/TW_Scripts@main/Coleta.js');" },
        { n: "Ver Coletas", c: "$.getScript('https://shinko-to-kuma.com/scripts/scavengingOverview.js');" },
        { n: "Planejador de Farm", c: "$.getScript('https://higamy.github.io/TW/Scripts/Approved/FarmGodCopy.js');" },
        { n: "FarmA", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/FarmA.js');" },
        { n: "FarmB", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/FarmB.js');" },
        { n: "Balancear Recursos", c: "$.getScript('https://dl.dropboxusercontent.com/s/bytvle86lj6230c/resBalancer.js?dl=0');" },
        { n: "Atacar Muralha Barb", c: "$.getScript('https://twscripts.dev/scripts/clearBarbarianWalls.js');" },
        { n: "Localizar Barbs", c: "$.getScript('https://twscripts.dev/scripts/barbsFinder.js');" },
        { n: "Localizar Bonus", c: "$.getScript('https://twscripts.dev/scripts/bonusFinderEvolved.js');" },
        { n: "Snip Cancel", c: "$.getScript('https://twscripts.dev/scripts/cancelSnipe.js');" },
        { n: "Info Player", c: "$.getScript('https://twscripts.dev/scripts/extendedPlayerInfo.js');" },
        { n: "Info Tribo", c: "$.getScript('https://twscripts.dev/scripts/extendedTribeInfo.js');" },
        { n: "Cap Nick/Coord", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/CapNickCoord.js');" },
        { n: "Calc Distancia", c: "$.getScript('https://twscripts.dev/scripts/obfsucated/commandTimer.min.js');" },
        { n: "Puxar Recursos", c: "$.getScript('https://shinko-to-kuma.com/scripts/res-senderV2.js');" },
        { n: "NT Fake", c: "$.getScript('https://twscripts.dev/scripts/evolvedFakeTrain.js');" },
        { n: "Vilas Front", c: "$.getScript('https://twscripts.dev/scripts/frontlineStacks.js');" },
        { n: "Gerador Fakes", c: "$.getScript('https://twscripts.dev/scripts/fakeScriptGenerator.js');" },
        { n: "Mapear Barbs", c: "$.getScript('https://twscripts.dev/scripts/mapBarbsOnly.js');" },
        { n: "Click Coord", c: "$.getScript('https://twscripts.dev/scripts/mapCoordPicker.js');" },
        { n: "Filtro Relat", c: "$.getScript('https://twscripts.dev/scripts/reportsOverviewHelper.js');" },
        { n: "Atk Massa", c: "$.getScript('https://twscripts.dev/scripts/massAttackPlanner.js');" },
        { n: "Tempo Massa", c: "$.getScript('https://twscripts.dev/scripts/massCommandTimer.js');" },
        { n: "Desbl Coleta", c: "$.getScript('https://twscripts.dev/scripts/massUnlockScav.js');" },
        { n: "Snip Massa", c: "$.getScript('https://twscripts.dev/scripts/massSnipe.js');" },
        { n: "Aux Farm", c: "$.getScript('https://twscripts.dev/scripts/playerFarmsFinder.js');" },
        { n: "Tpl Tropas", c: "$.getScript('https://twscripts.dev/scripts/troopTemplatesManager.js');" },
        { n: "Agenda Atk", c: "$.getScript('https://raw.githubusercontent.com/CavernaScripts/TW_Scripts/refs/heads/main/Agendador_de_Ataques.js');" },
        { n: "Plan Torre", c: "$.getScript('https://shinko-to-kuma.com/scripts/watchTower.js');" },
        { n: "ID Atks", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Identificador_de_ATK.js');" },
        { n: "Contar Tropas", c: "$.getScript('https://twscripts.dev/scripts/troopsCounterFixed.js');" },
        { n: "Membros Atacados", c: "$.getScript('https://twscripts.dev/scripts/tribePlayersUnderAttack.js');" },
        { n: "Mapa Stats Tribo", c: "$.getScript('https://twscripts.dev/scripts/tribeStatsTool.js');" },
        { n: "Ver Tropas", c: "$.getScript('https://twscripts.dev/scripts/countHomeTroops.js');" },
        { n: "Vender Rec", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Vender_Recursos.js');" },
        { n: "Convite K", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/convidar.js');" },
        { n: "Add Amigo", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Adicionar_Amigos.js');" },
        { n: "Derrubar Muralha", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Derrubar_muralha.js');" },
        { n: "Hist Player", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Historico_Players_Tribo.js');" },
        { n: "Filtro Tribo K", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Filtro_Tribo_K.js');" },
        { n: "Classif K", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Classificacao_Player_K.js');" }
    ];

    const GlobalSystem = {
        fixos: [
            { n: "Edifício principal", c: "main" },
            { n: "Recrutar", c: "train" },
            { n: "Academia", c: "snob" },
            { n: "Ferreiro", c: "smith" },
            { n: "Praça de reunião", c: "place" },
            { n: "Mercado", c: "market" }
        ],

        init: function() {
            this.injectStyles();
            this.renderBarra();
            this.renderHub();
            this.renderVillageArrows();
            this.handleMapResize();
        },

        injectStyles: function() {
            const css = `
                #caverna-hub-panel { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); width: 420px; max-height: 70vh; background: #f4e4bc; border: 2px solid #3b240b; z-index: 10001; display: none; overflow-y: auto; padding: 0; box-shadow: 0 0 15px #000; border-radius: 4px; font-family: Verdana, Arial; }
                .hub-header { background: #3b240b; color: #f4e4bc; padding: 8px; text-align: center; font-weight: bold; position: sticky; top: 0; }
                .hub-row { display: flex; align-items: center; padding: 6px; border-bottom: 1px solid #3b240b33; gap: 8px; }
                .hub-name { font-size: 10px; font-weight: bold; flex: 1; color: #3b240b; }
                .hub-input { width: 90px; font-size: 10px; padding: 2px; border: 1px solid #3b240b; }
                .hub-btn { padding: 4px 8px; font-size: 10px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 3px; font-weight: bold; }
                .move-btn { cursor: pointer; font-size: 14px; padding: 0 4px; color: #7d510f; font-weight: bold; user-select: none; }
                .remove-btn-cav { color: #dc3545; font-weight: bold; margin-left: 6px; font-size: 16px; cursor: pointer; user-select: none; }
                #map-resizer-container { padding: 10px; background: #e3d5b3; border: 1px solid #7d510f; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
                .quickbar_row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; width: 100%; }
                .row-divider { border-top: 1px solid #3b240b44; margin: 5px 0; width: 90%; }
            `;
            $('<style>').text(css).appendTo('head');
        },

        renderBarra: function() {
            if ($('#quickbar_outer').length) $('#quickbar_outer').remove();
            const extras = JSON.parse(GM_getValue('caverna_extras', '[]'));

            // Linha 1: Fixos
            let fixosHtml = '';
            this.fixos.forEach(s => {
                fixosHtml += `<li class="quickbar_item" style="display:inline-block; margin: 4px 10px; white-space:nowrap;">
                    <a class="quickbar_link" href="${game_data.link_base_pure}${s.c}" style="text-decoration:none; font-weight: bold; color: #4b2a08; font-size: 12px;">${s.n}</a>
                </li>`;
            });
            // Botão do Hub na Linha 1
            fixosHtml += `<li class="quickbar_item" style="display:inline-block; margin: 4px 10px; white-space:nowrap;">
                <a id="open-hub-link" class="quickbar_link" href="#" style="text-decoration:none; font-weight: bold; color: #0056b3; font-size: 12px;">[ Pack Script Instal ]</a>
            </li>`;

            // Linha 2: Extras (Instalados)
            let extrasHtml = '';
            extras.forEach((s, i) => {
                extrasHtml += `
                    <li class="quickbar_item" style="display:inline-block; margin: 4px 8px; white-space:nowrap;">
                        <span style="display: flex; align-items: center; background: #eee4cc; padding: 2px 6px; border-radius: 3px; border: 1px solid #3b240b22;">
                            <span class="move-btn cav-move-left" data-index="${i}"> < </span>
                            <a class="quickbar_link" href="javascript:${s.c}" style="text-decoration:none; font-weight: 500; margin: 0 4px; color: #4b2a08;">${s.n}</a>
                            <span class="move-btn cav-move-right" data-index="${i}"> > </span>
                            <span class="remove-btn-cav cav-delete" data-index="${i}"> × </span>
                        </span>
                    </li>`;
            });

            const barraHtml = `
            <table id="quickbar_outer" align="center" width="100%" cellspacing="0" style="margin-bottom:10px;">
                <tbody><tr><td class="main" style="background:#f4e4bc; border:1px solid #3b240b; padding:8px;">
                    <div class="quickbar_row">
                        <ul class="menu quickbar" style="margin:0; padding:0; list-style:none; display:flex; flex-wrap:wrap; justify-content:center;">
                            ${fixosHtml}
                        </ul>
                    </div>
                    ${extras.length > 0 || true ? `
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <div class="row-divider"></div>
                        <ul class="menu quickbar" style="margin:0; padding:0; list-style:none; display:flex; flex-wrap:wrap; justify-content:center;">
                            ${extrasHtml}
                            <li style="margin-left:10px;"><button id="cav-manual-plus" title="Adicionar Manualmente" style="background:#28a745; color:white; border:none; border-radius:3px; cursor:pointer; font-weight:bold; padding:2px 8px;">+</button></li>
                        </ul>
                    </div>` : ''}
                </td></tr></tbody>
            </table>`;

            $('#header_info').before(barraHtml);
            this.bindEvents();
        },

        bindEvents: function() {
            const self = this;
            $('#open-hub-link').off().on('click', function(e) { e.preventDefault(); $('#caverna-hub-panel').toggle(); });
            $('.cav-move-left').off().on('click', function() { self.moveExtra($(this).data('index'), -1); });
            $('.cav-move-right').off().on('click', function() { self.moveExtra($(this).data('index'), 1); });
            $('.cav-delete').off().on('click', function() { self.removeExtra($(this).data('index')); });
            $('#cav-manual-plus').off().on('click', function() { self.addManual(); });
        },

        renderHub: function() {
            if ($('#caverna-hub-panel').length) return;
            let panelHtml = `<div id="caverna-hub-panel">
                <div class="hub-header">INSTALADOR CAP CAVERNA <span id="close-hub" style="float:right; cursor:pointer; padding-right:5px;">X</span></div>`;
            scriptsHub.forEach((s, i) => {
                panelHtml += `<div class="hub-row">
                    <div class="hub-name">${s.n}</div>
                    <input type="text" class="hub-input" id="hub-n-${i}" value="${s.n}">
                    <button class="hub-btn cav-hub-inst" data-id="${i}">Instalar</button>
                </div>`;
            });
            panelHtml += `</div>`;
            $('body').append(panelHtml);

            $('#close-hub').on('click', () => $('#caverna-hub-panel').hide());

            $('.cav-hub-inst').on('click', (e) => {
                const id = $(e.target).data('id');
                const name = $(`#hub-n-${id}`).val();
                let extras = JSON.parse(GM_getValue('caverna_extras', '[]'));
                extras = extras.filter(ex => ex.n !== name);
                extras.push({ n: name, c: scriptsHub[id].c });
                GM_setValue('caverna_extras', JSON.stringify(extras));
                this.renderBarra();
                UI.SuccessMessage(`"${name}" Instalado na linha de baixo!`);
            });
        },

        moveExtra: function(index, direction) {
            let extras = JSON.parse(GM_getValue('caverna_extras', '[]'));
            let newIndex = index + direction;
            if (newIndex >= 0 && newIndex < extras.length) {
                [extras[index], extras[newIndex]] = [extras[newIndex], extras[index]];
                GM_setValue('caverna_extras', JSON.stringify(extras));
                this.renderBarra();
            }
        },

        removeExtra: function(index) {
            let extras = JSON.parse(GM_getValue('caverna_extras', '[]'));
            if (confirm(`Remover "${extras[index].n}"?`)) {
                extras.splice(index, 1);
                GM_setValue('caverna_extras', JSON.stringify(extras));
                this.renderBarra();
            }
        },

        addManual: function() {
            const n = prompt("Nome do Script:");
            let c = prompt("Link ou Código JS:");
            if (!n || !c) return;
            if (c.startsWith('http')) c = `$.getScript('${c}');`;
            let extras = JSON.parse(GM_getValue('caverna_extras', '[]'));
            extras.push({ n: n, c: c });
            GM_setValue('caverna_extras', JSON.stringify(extras));
            this.renderBarra();
        },

        handleMapResize: function() {
            if (game_data.screen !== 'map') return;
            const parent = document.getElementById("inner-border");
            if (!parent) return;
            const mapSize = localStorage.getItem('cap_map_size') || "";
            const miniSize = localStorage.getItem('cap_minimap_size') || "";

            const html = `
                <div id="map-resizer-container">
                    <b style="margin-right:5px;">Mapa:</b>
                    <input type="number" id="cav-map-in" class="text-input" style="width:50px; margin-right:5px;" value="${mapSize}">
                    <button id="cav-map-btn" class="btn" style="margin-right:15px;">Aplicar</button>
                    <b style="margin-right:5px;">Minimapa:</b>
                    <input type="number" id="cav-mini-in" class="text-input" style="width:50px; margin-right:5px;" value="${miniSize}">
                    <button id="cav-mini-btn" class="btn">Aplicar</button>
                </div>`;
            $(parent).prepend(html);

            const apply = (type) => {
                if (type === 'map') {
                    const val = $('#cav-map-in').val();
                    TWMap.resize(parseInt(val), true);
                    localStorage.setItem('cap_map_size', val);
                } else {
                    const val = $('#cav-mini-in').val();
                    TWMap.minimap.resize(parseInt(val), parseInt(val));
                    localStorage.setItem('cap_minimap_size', val);
                }
            };
            $('#cav-map-btn').click(() => apply('map'));
            $('#cav-mini-btn').click(() => apply('minimap'));

            const initMap = () => {
                if (typeof TWMap !== 'undefined' && TWMap.minimap && TWMap.minimap.resize) {
                    if (mapSize) TWMap.resize(parseInt(mapSize), true);
                    if (miniSize) TWMap.minimap.resize(parseInt(miniSize), parseInt(miniSize));
                } else { setTimeout(initMap, 300); }
            };
            initMap();
        },

        renderVillageArrows: function() {
            if ($('.arrowCell').length) return;
            const row = $('#menu_row2');
            if (row.length) {
                row.prepend(`<td class="box-item icon-box separate arrowCell"><a href="javascript:void(0)" onclick="$('.groupLeft').click()"><span class="groupLeft"></span></a></td>
                             <td class="box-item icon-box arrowCell"><a href="javascript:void(0)" onclick="$('.groupRight').click()"><span class="groupRight"></span></a></td>`);
            }
        }
    };

    const timer = setInterval(() => {
        if ($('#header_info').length) {
            GlobalSystem.init();
            clearInterval(timer);
        }
    }, 500);
})();
