(function() {
    'use strict';

    const scriptsData = [
        /* CATEGORIA: FARM & COLETA */
        { n: "Coleta", c: "$.getScript('https://cdn.jsdelivr.net/gh/CavernaScripts/TW_Scripts@main/Coleta.js');", cat: "Farm" },
        { n: "Coleta em massa", c: "$.getScript('https://cdn.jsdelivr.net/gh/CavernaScripts/TW_Scripts@main/Coleta.js');", cat: "Farm" },
        { n: "Ver Coletas", c: "$.getScript('https://shinko-to-kuma.com/scripts/scavengingOverview.js');", cat: "Farm" },
        { n: "Planejador de Farm", c: "$.getScript('https://higamy.github.io/TW/Scripts/Approved/FarmGodCopy.js');", cat: "Farm" },
        { n: "Farm A", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/FarmA.js');", cat: "Farm" },
        { n: "Farm B", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/FarmB.js');", cat: "Farm" },
        { n: "Auxiliar de Farm", c: "$.getScript('https://twscripts.dev/scripts/playerFarmsFinder.js');", cat: "Farm" },
        { n: "Desbloquear coletas em massa", c: "$.getScript('https://twscripts.dev/scripts/massUnlockScav.js');", cat: "Farm" },

        /* CATEGORIA: GUERRA */
        { n: "Agendar envio de ataques", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Agendador_de_Ataques.js');", cat: "Guerra" },
        { n: "Ataques em massa", c: "$.getScript('https://twscripts.dev/scripts/massAttackPlanner.js');", cat: "Guerra" },
        { n: "Snip em massa", c: "$.getScript('https://twscripts.dev/scripts/massSnipe.js');", cat: "Guerra" },
        { n: "NT Fake", c: "$.getScript('https://twscripts.dev/scripts/evolvedFakeTrain.js');", cat: "Guerra" },
        { n: "Gerador de Script Fakes", c: "$.getScript('https://twscripts.dev/scripts/fakeScriptGenerator.js');", cat: "Guerra" },
        { n: "Calcular Snip por cancelamento", c: "$.getScript('https://twscripts.dev/scripts/cancelSnipe.js');", cat: "Guerra" },
        { n: "Identificar ataques", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Identificador_de_ATK.js');", cat: "Guerra" },
        { n: "Calculadora de tempo de ataque", c: "$.getScript('https://twscripts.dev/scripts/massCommandTimer.js');", cat: "Guerra" },
        { n: "Far M (Derrubar Muralha)", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Derrubar_muralha.js');", cat: "Guerra" },
        { n: "Atacar Muralha de Barbaras", c: "$.getScript('https://twscripts.dev/scripts/clearBarbarianWalls.js');", cat: "Guerra" },

        /* CATEGORIA: GESTÃO & TROPAS */
        { n: "Balancear Recursos", c: "$.getScript('https://dl.dropboxusercontent.com/s/bytvle86lj6230c/resBalancer.js?dl=0');", cat: "Gestão" },
        { n: "Puxar recursos (Moedas)", c: "$.getScript('https://shinko-to-kuma.com/scripts/res-senderV2.js');", cat: "Gestão" },
        { n: "Vender Recursos", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Vender_Recursos.js');", cat: "Gestão" },
        { n: "Contagem de tropas", c: "$.getScript('https://twscripts.dev/scripts/troopsCounterFixed.js');", cat: "Gestão" },
        { n: "Verificar tropas nas aldeias", c: "$.getScript('https://twscripts.dev/scripts/countHomeTroops.js');", cat: "Gestão" },
        { n: "Modelo de Tropas", c: "$.getScript('https://twscripts.dev/scripts/troopTemplatesManager.js');", cat: "Gestão" },
        { n: "Localizar vilas do front", c: "$.getScript('https://twscripts.dev/scripts/frontlineStacks.js');", cat: "Gestão" },

        /* CATEGORIA: MAPA & INFO */
        { n: "Localizar Aldeias Barbaras", c: "$.getScript('https://twscripts.dev/scripts/barbsFinder.js');", cat: "Mapa" },
        { n: "Localizar aldeias Bonus", c: "$.getScript('https://twscripts.dev/scripts/bonusFinderEvolved.js');", cat: "Mapa" },
        { n: "Mapear Aldeias Barbaras", c: "$.getScript('https://twscripts.dev/scripts/mapBarbsOnly.js');", cat: "Mapa" },
        { n: "Coletar coordenadas com click", c: "$.getScript('https://twscripts.dev/scripts/mapCoordPicker.js');", cat: "Mapa" },
        { n: "Gerador de mapa de tribos", c: "$.getScript('https://twscripts.dev/scripts/tribeStatsTool.js');", cat: "Mapa" },
        { n: "Calculadora de distancia", c: "$.getScript('https://twscripts.dev/scripts/obfsucated/commandTimer.min.js');", cat: "Mapa" },
        { n: "Informações de Player", c: "$.getScript('https://twscripts.dev/scripts/extendedPlayerInfo.js');", cat: "Mapa" },
        { n: "Informações de Tribo", c: "$.getScript('https://twscripts.dev/scripts/extendedTribeInfo.js');", cat: "Mapa" },

        /* CATEGORIA: TRIBO & SOCIAL */
        { n: "Capturar Nick e Coordenadas", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/CapNickCoord.js');", cat: "Social" },
        { n: "Verificar ataques na tribo", c: "$.getScript('https://twscripts.dev/scripts/tribePlayersUnderAttack.js');", cat: "Social" },
        { n: "Convite K", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/convidar.js');", cat: "Social" },
        { n: "AddAmigo", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Adicionar_Amigos.js');", cat: "Social" },
        { n: "HisPlayTribo", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Historico_Players_Tribo.js');", cat: "Social" },
        { n: "ClasTriboK", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Filtro_Tribo_K.js');", cat: "Social" },
        { n: "ClasPlayK", c: "$.getScript('https://raw.githack.com/CavernaScripts/TW_Scripts/main/Classificacao_Player_K.js');", cat: "Social" },
        
        /* CATEGORIA: OUTROS */
        { n: "Planejador de Torre", c: "$.getScript('https://shinko-to-kuma.com/scripts/watchTower.js');", cat: "Outros" },
        { n: "Filtro de Relatorios", c: "$.getScript('https://twscripts.dev/scripts/reportsOverviewHelper.js');", cat: "Outros" }
    ];

    const UI_System = {
        activeCat: "Geral",

        init: function() {
            if ($('#cap-premium-overlay').length) return;
            this.injectStyles();
            this.render();
        },

        injectStyles: function() {
            const css = `
                #cap-premium-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 99999; display: flex; align-items: center; justify-content: center; font-family: Verdana, Arial; }
                #cap-premium-modal { width: 620px; background: #f4e4bc; border: 3px solid #3b240b; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden; position: relative; }
                .cap-header { background: linear-gradient(180deg, #4b2a08 0%, #3b240b 100%); color: #f4e4bc; padding: 15px; font-weight: bold; text-align: center; font-size: 16px; text-shadow: 1px 1px 2px #000; }
                .cap-close { position: absolute; right: 15px; top: 12px; cursor: pointer; color: #fff; font-size: 20px; font-weight: bold; }
                .cap-search-container { padding: 12px; background: #e3d5b3; display: flex; justify-content: center; border-bottom: 1px solid #3b240b33; }
                #cap-search-field { width: 95%; padding: 8px; border: 1px solid #3b240b; border-radius: 4px; font-size: 14px; }
                .cap-tabs { display: flex; background: #d6c49a; border-bottom: 1px solid #3b240b; flex-wrap: wrap; }
                .cap-tab { flex: 1; min-width: 80px; padding: 10px 5px; text-align: center; cursor: pointer; font-size: 11px; font-weight: bold; color: #3b240b; border-right: 1px solid #3b240b22; transition: 0.2s; }
                .cap-tab.active { background: #f4e4bc; border-bottom: 4px solid #28a745; margin-bottom: -1px; }
                .cap-list { max-height: 400px; overflow-y: auto; padding: 10px; background: #f4e4bc; }
                .cap-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #3b240b15; }
                .cap-item:hover { background: #eee4cc; }
                .cap-name { font-size: 12px; color: #3b240b; font-weight: bold; }
                .cap-btn-inst { background: #28a745; color: #fff; border: none; padding: 6px 14px; cursor: pointer; border-radius: 4px; font-size: 11px; font-weight: bold; }
                .cap-btn-inst:hover { background: #218838; }
            `;
            $('<style>').text(css).appendTo('head');
        },

        render: function() {
            const self = this;
            const categories = ["Geral", "Farm", "Guerra", "Gestão", "Mapa", "Social", "Outros"];
            const html = `
                <div id="cap-premium-overlay">
                    <div id="cap-premium-modal">
                        <div class="cap-header">PACK PREMIUN INSTAL <span class="cap-close">×</span></div>
                        <div class="cap-search-container"><input type="text" id="cap-search-field" placeholder="Pesquisar script..."></div>
                        <div class="cap-tabs">
                            ${categories.map(cat => `<div class="cap-tab ${cat === 'Geral' ? 'active' : ''}" data-cat="${cat}">${cat}</div>`).join('')}
                        </div>
                        <div id="cap-script-body" class="cap-list"></div>
                    </div>
                </div>`;
            $('body').append(html);
            this.updateList();

            $('.cap-close').on('click', () => $('#cap-premium-overlay').remove());
            $('.cap-tab').on('click', function() {
                $('.cap-tab').removeClass('active');
                $(this).addClass('active');
                self.activeCat = $(this).data('cat');
                self.updateList($('#cap-search-field').val());
            });
            $('#cap-search-field').on('input', function() { self.updateList($(this).val()); });
        },

        updateList: function(filter = "") {
            const container = $('#cap-script-body');
            container.empty();
            const filtered = scriptsData.filter(s => {
                const matchCat = this.activeCat === "Geral" || s.cat === this.activeCat;
                const matchName = s.n.toLowerCase().includes(filter.toLowerCase());
                return matchCat && matchName;
            });
            filtered.forEach(s => {
                const item = $(`<div class="cap-item"><span class="cap-name">${s.n}</span><button class="cap-btn-inst">Adicionar à Barra</button></div>`);
                item.find('button').on('click', () => this.installSilently(s.n, s.c));
                container.append(item);
            });
        },

        // A MÁGICA DO REDALERT ADAPTADA:
        installSilently: function(name, code) {
            if (!game_data.player.premium) {
                return UI.ErrorMessage("Conta Premium necessária.");
            }

            // Prepara os dados no formato que o TW espera (POST)
            let scriptData = `hotkey=&name=${encodeURIComponent(name)}&href=${encodeURIComponent('javascript:' + code)}`;
            let action = '/game.php?screen=settings&mode=quickbar_edit&action=quickbar_edit&';

            jQuery.ajax({
                url: action,
                type: 'POST',
                data: scriptData + `&h=${csrf_token}`,
                success: function() {
                    UI.SuccessMessage(`Script "${name}" adicionado à Barra de Atalhos!`);
                },
                error: function() {
                    UI.ErrorMessage("Erro ao adicionar script.");
                }
            });
        }
    };

    UI_System.init();
})();
