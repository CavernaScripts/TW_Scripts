// ==UserScript==
// @name                Upador Cap Caverna - Fluxo Contínuo 5s
// @version             3.5.0
// @description         Verificação constante a cada 5s sem interrupções.
// @author              Marcos v.s Marques & Gemini
// @include             http*://*.*game.php*
// @require             http://code.jquery.com/jquery-1.12.4.min.js
// @grant               unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    let abasVisitadasNoCiclo = new Set();

    console.log("-- [SISTEMA CAP CAVERNA]: Fluxo de Verificação Contínua (5s) Ativo --");

    setInterval(function() {
        // RESTRIÇÃO: Apenas na tela do Edifício Principal
        if (!window.location.href.includes('screen=main')) return;

        const popup = $('.quest-popup-body');
        const popupVisivel = popup.is(':visible');
        const badge = $('#reward-system-badge');

        // SEGURANÇA: Bloqueio de custos PP
        if ($('div:contains("pontos premium"), div:contains("custos extras"), .confirmation-box').is(':visible')) {
            $('.btn-cancel, .btn-confirm-no').click();
            return;
        }

        // --- PRIORIDADE ZERO: FINALIZAÇÃO GRATUITA (< 3 MINUTOS) ---
        const btnGratis = $('#buildqueue a').filter(function() {
            return $(this).text().trim().toLowerCase().includes("grátis") && $(this).is(':visible');
        });

        if (btnGratis.length > 0) {
            btnGratis[0].click();
            return; // Após agir, aguarda o próximo ciclo de 5s
        }

        // --- PASSO 1: CONSTRUÇÃO (FILA < 2) ---
        if (!popupVisivel) {
            let itensNaFila = $('#buildqueue tr.buildorder_id').length;
            if (itensNaFila < 2) {
                if (executarOrdemConstrucao()) return;
            }
        }

        // --- PASSO 3: ABRIR MISSÃO (ÍCONE) ---
        if ($('#new_quest:visible').length > 0 && !popupVisivel) {
            abasVisitadasNoCiclo.clear();
            $('#new_quest').click();
            return;
        }

        // --- LÓGICA DENTRO DO POPUP (PASSOS 4, 5 e 6) ---
        if (popupVisivel) {
            
            // PASSO 4: CONCLUIR MISSÃO
            const btnConcluir = $('.btn-confirm-yes:visible, .status-btn:visible').filter(function() {
                const t = $(this).text().toLowerCase();
                return t.includes("missão completa") || t.includes("finalizar");
            });

            if (btnConcluir.length > 0) {
                btnConcluir[0].click();
                return;
            }

            // Varredura de abas para encontrar missões ocultas
            const abas = $('.quest-link:visible');
            let proxima = null;
            abas.each(function() {
                const id = $(this).attr('data-quest-id') || $(this).text().trim();
                if (!abasVisitadasNoCiclo.has(id)) {
                    proxima = this;
                    abasVisitadasNoCiclo.add(id);
                    return false;
                }
            });
            if (proxima) {
                proxima.click();
                return;
            }

            // PASSO 5: REIVINDICAR RECOMPENSAS
            const rewardTab = $('.tab-link[data-tab="reward-tab"]');
            if (badge.is(':visible') && rewardTab.length > 0) {
                if (!rewardTab.parent().hasClass('selected-tab')) {
                    rewardTab[0].click();
                    return;
                }
                const btnClaim = $('.reward-system-claim-button:visible');
                if (btnClaim.length > 0) {
                    btnClaim[0].click();
                    return;
                }
            }

            // PASSO 6: FECHAR JANELA "X"
            // Se chegou aqui e não houve ação de concluir ou coletar, fecha a janela.
            const btnX = $('.popup_box_close');
            if (btnX.length > 0) {
                btnX[0].click();
            }
        }

    }, 5000); // Verificação total a cada 5 segundos

    function executarOrdemConstrucao() {
        const s = ["main_buildlink_wood_1", "main_buildlink_stone_1", "main_buildlink_iron_1", "main_buildlink_wood_2", "main_buildlink_stone_2", "main_buildlink_main_2", "main_buildlink_main_3", "main_buildlink_barracks_1", "main_buildlink_wood_3", "main_buildlink_stone_3", "main_buildlink_barracks_2", "main_buildlink_storage_2", "main_buildlink_iron_2", "main_buildlink_storage_3", "main_buildlink_barracks_3", "main_buildlink_statue_1", "main_buildlink_farm_2", "main_buildlink_iron_3", "main_buildlink_main_4", "main_buildlink_main_5", "main_buildlink_smith_1", "main_buildlink_wood_4", "main_buildlink_stone_4", "main_buildlink_wall_1", "main_buildlink_hide_2", "main_buildlink_hide_3", "main_buildlink_wood_5", "main_buildlink_stone_5", "main_buildlink_market_1", "main_buildlink_wood_6", "main_buildlink_stone_6", "main_buildlink_wood_7", "main_buildlink_stone_7", "main_buildlink_iron_4", "main_buildlink_iron_5", "main_buildlink_iron_6", "main_buildlink_wood_8", "main_buildlink_stone_8", "main_buildlink_iron_7", "main_buildlink_wood_9", "main_buildlink_stone_9", "main_buildlink_wood_10", "main_buildlink_stone_10", "main_buildlink_storage_5", "main_buildlink_storage_6", "main_buildlink_storage_7", "main_buildlink_storage_8", "main_buildlink_storage_9", "main_buildlink_wood_11", "main_buildlink_stone_11", "main_buildlink_wood_12", "main_buildlink_stone_12", "main_buildlink_iron_8", "main_buildlink_iron_9", "main_buildlink_iron_10", "main_buildlink_wood_13", "main_buildlink_stone_13", "main_buildlink_iron_11", "main_buildlink_farm_3", "main_buildlink_farm_4", "main_buildlink_farm_5", "main_buildlink_iron_12", "main_buildlink_farm_6", "main_buildlink_iron_13", "main_buildlink_iron_14", "main_buildlink_storage_12", "main_buildlink_storage_13", "main_buildlink_wood_14", "main_buildlink_stone_14", "main_buildlink_wood_15", "main_buildlink_stone_15", "main_buildlink_storage_14", "main_buildlink_storage_15", "main_buildlink_wood_16", "main_buildlink_wood_17", "main_buildlink_stone_17", "main_buildlink_storage_16", "main_buildlink_storage_17", "main_buildlink_iron_15", "main_buildlink_iron_16", "main_buildlink_wood_18", "main_buildlink_wood_19", "main_buildlink_stone_19", "main_buildlink_storage_18", "main_buildlink_storage_19", "main_buildlink_storage_20", "main_buildlink_storage_21", "main_buildlink_wood_20", "main_buildlink_stone_20", "main_buildlink_iron_18", "main_buildlink_wood_21", "main_buildlink_stone_21", "main_buildlink_storage_22", "main_buildlink_iron_19", "main_buildlink_wood_22", "main_buildlink_stone_22", "main_buildlink_wood_23", "main_buildlink_stone_23", "main_buildlink_iron_20", "main_buildlink_iron_21", "main_buildlink_iron_22", "main_buildlink_farm_22", "main_buildlink_wood_24", "main_buildlink_stone_24", "main_buildlink_iron_23", "main_buildlink_wood_25", "main_buildlink_stone_25", "main_buildlink_iron_24", "main_buildlink_storage_23", "main_buildlink_wall_19", "main_buildlink_storage_24", "main_buildlink_storage_25", "main_buildlink_wall_20", "main_buildlink_wood_26", "main_buildlink_stone_26", "main_buildlink_iron_25", "main_buildlink_storage_26", "main_buildlink_storage_27", "main_buildlink_wood_27", "main_buildlink_stone_27", "main_buildlink_iron_26", "main_buildlink_wood_28", "main_buildlink_stone_28", "main_buildlink_iron_27", "main_buildlink_wood_29", "main_buildlink_stone_29", "main_buildlink_iron_28", "main_buildlink_wood_30", "main_buildlink_stone_30", "main_buildlink_iron_29", "main_buildlink_iron_30"];
        for (let id of s) {
            let b = document.getElementById(id);
            if (b && $(b).hasClass('btn-build') && $(b).is(':visible')) {
                b.click();
                return true;
            }
        }
        return false;
    }

})();
