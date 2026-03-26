/*
 * Script: Coleta em Massa - Cap Caverna Edition
 * Base Original: Sophie "Shinko to Kuma"
 */

(function() {
    "use strict";

    var serverTimeTemp = $("#serverDate")[0].innerText + " " + $("#serverTime")[0].innerText;
    var serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\/\-]([0][1-9]|1[012])[\/\-](\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
    var serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);
    var is_mobile = !!navigator.userAgent.match(/iphone|android|blackberry/ig) || false;
    var scavengeInfo;

    if (window.location.href.indexOf('screen=place&mode=scavenge_mass') < 0) {
        window.location.assign(game_data.link_base_pure + "place&mode=scavenge_mass");
        return;
    }

    $("#massScavengeSophie").remove();

    var langShinko = [
        "COLETA EM MASSA - CAP CAVERNA",
        "Selecione as unidades (arraste para ordenar)",
        "Categorias para usar",
        "Retorno das coletas (aproximadamente)",
        "Tempo",
        "CALCULAR E GERAR GRUPOS",
        "Desenvolvido por: ",
        "Envio por blocos de 50 aldeias",
        "Lançar Grupo "
    ];

    // --- CONFIGURACOES E LOGICA ---
    var troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled")) || {};
    var keepHome = JSON.parse(localStorage.getItem("keepHome")) || { "spear": 0, "sword": 0, "axe": 0, "archer": 0, "light": 0, "marcher": 0, "heavy": 0 };
    var categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled")) || [true, true, true, true];
    var sendOrder = JSON.parse(localStorage.getItem("sendOrder")) || game_data.units.filter(u => !["militia", "snob", "ram", "catapult", "spy", "knight"].includes(u));
    var runTimes = JSON.parse(localStorage.getItem("runTimes")) || { "off": 4, "def": 3 };
    var URLReq = game_data.player.sitter > 0 ? `game.php?t=${game_data.player.id}&screen=place&mode=scavenge_mass` : "game.php?&screen=place&mode=scavenge_mass";
    
    var squad_requests = [], duration_factor, duration_exponent, duration_initial_seconds;
    var categoryNames = JSON.parse("[" + $.find('script:contains("ScavengeMassScreen")')[0].innerHTML.match(/\{.*\:\{.*\:.*\}\}/g) + "]")[0];
    var time = { 'off': 0, 'def': 0 };

    var backgroundColor = "#F4E4BC", titleColor = "#803000";

    // --- FUNCAO DE BUSCA AJAX ---
    window.getData = function() {
        let URLs = [];
        $.get(URLReq, function (data) {
            let pages = $(".paged-nav-item").length > 0 ? parseInt($(".paged-nav-item")[$(".paged-nav-item").length - 1].href.match(/page=(\d+)/)[1]) : 0;
            for (var i = 0; i <= pages; i++) URLs.push(URLReq + "&page=" + i);
            let tempData = JSON.parse($(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[0]);
            duration_exponent = tempData[1].duration_exponent;
            duration_factor = tempData[1].duration_factor;
            duration_initial_seconds = tempData[1].duration_initial_seconds;
        }).done(function () {
            let arrayWithData = "[";
            let completed = 0;
            URLs.forEach(url => {
                $.get(url, (data) => {
                    arrayWithData += $(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[2] + ",";
                    completed++;
                    if (completed === URLs.length) {
                        arrayWithData = arrayWithData.substring(0, arrayWithData.length - 1) + "]";
                        scavengeInfo = JSON.parse(arrayWithData);
                        squad_requests = [];
                        scavengeInfo.forEach(v => calculateHaulCategories(v));
                        gerarBotoesEnvio();
                    }
                });
            });
        });
    };

    function calculateHaulCategories(data) {
        if (!data.has_rally_point) return;
        var troopsAllowed = {};
        sendOrder.forEach(u => {
            if (troopTypeEnabled[u]) {
                troopsAllowed[u] = Math.max(0, data.unit_counts_home[u] - (parseInt(keepHome[u]) || 0));
            }
        });
        
        let totalLoot = 0;
        let carryMap = { spear: 25, sword: 15, axe: 10, archer: 10, light: 80, marcher: 50, heavy: 50, knight: 100 };
        for (let u in troopsAllowed) totalLoot += troopsAllowed[u] * (data.unit_carry_factor * (carryMap[u] || 0));
        if (totalLoot === 0) return;

        let haul = parseInt(((runTimes.off * 3600) / duration_factor - duration_initial_seconds) ** (1 / duration_exponent) / 100) ** 0.5;
        let haulRates = { 1: 0.1, 2: 0.25, 3: 0.50, 4: 0.75 };
        
        let unitsReady = { 0: {}, 1: {}, 2: {}, 3: {} };
        for (let j = 3; j >= 0; j--) {
            if (!categoryEnabled[j] || data.options[j+1].scavenging_squad != null) continue;
            let reach = haul / haulRates[j+1];
            sendOrder.forEach(u => {
                if (troopsAllowed[u] > 0 && reach > 0) {
                    let amount = Math.min(troopsAllowed[u], Math.floor(reach / (carryMap[u] || 1)));
                    if (amount > 0) {
                        unitsReady[j][u] = amount;
                        reach -= amount * (carryMap[u] || 1);
                        troopsAllowed[u] -= amount;
                    }
                }
            });
            if (Object.keys(unitsReady[j]).length > 0) {
                squad_requests.push({ village_id: data.village_id, candidate_squad: { unit_counts: unitsReady[j], carry_max: 99999999 }, option_id: j + 1, use_premium: false });
            }
        }
    }

    function gerarBotoesEnvio() {
        $("#massScavengeFinal").remove();
        let htmlFinal = `<div id="massScavengeFinal" style="position:fixed;top:100px;left:50%;transform:translateX(-50%);background:${backgroundColor};border:2px solid #7d510f;z-index:10001;padding:15px;box-shadow:5px 5px 15px #000;">
            <b style="color:${titleColor}">${langShinko[7]}</b><hr>`;
        for (let i = 0; i < squad_requests.length; i += 50) {
            let chunk = squad_requests.slice(i, i + 50);
            let groupIdx = (i/50) + 1;
            htmlFinal += `<button class="btn btn-success" style="width:100%;margin-bottom:5px;" onclick="window.sendGroup(${groupIdx}, ${JSON.stringify(chunk).replace(/"/g, '&quot;')})">${langShinko[8]}${groupIdx}</button><br>`;
        }
        htmlFinal += `<button class="btn btn-danger" onclick="$('#massScavengeFinal').remove()" style="width:100%">FECHAR</button></div>`;
        $("body").append(htmlFinal);
    }

    window.sendGroup = function(num, data) {
        TribalWars.post('scavenge_api', { ajaxaction: 'send_squads' }, { squad_requests: data }, function() {
            UI.SuccessMessage("Grupo " + num + " enviado com sucesso!");
            $(`button:contains('${langShinko[8]}${num}')`).remove();
        });
    };

    window.readyToSend = function() {
        sendOrder.forEach(u => {
            troopTypeEnabled[u] = $(`#chk_${u}`).is(":checked");
            keepHome[u] = $(`#bkp_${u}`).val();
        });
        runTimes.off = $("#run_off").val();
        localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
        localStorage.setItem("keepHome", JSON.stringify(keepHome));
        window.getData();
    };

    // --- UI ---
    let htmlMain = `
    <div id="massScavengeSophie" style="width:600px;background:${backgroundColor};border:2px solid #7d510f;position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:10000;padding:10px;">
        <h3 style="text-align:center;color:${titleColor}">${langShinko[0]}</h3>
        <table class="vis" style="width:100%;text-align:center;">
            <tr>${sendOrder.map(u => `<td><img src="https://dsbr.innogamescdn.com/asset/8098c77/graphic/unit/unit_${u}.png"><br><input type="checkbox" id="chk_${u}" checked><br><input type="text" id="bkp_${u}" value="0" size="3"></td>`).join('')}</tr>
        </table>
        <div style="text-align:center;margin:10px;">
            Tempo (Horas): <input type="text" id="run_off" value="5" size="2">
        </div>
        <button class="btn btn-confirm" style="width:100%" onclick="window.readyToSend()">${langShinko[5]}</button>
        <center><small>Desenvolvido por: Cap Caverna</small></center>
    </div>`;
    $("body").append(htmlMain);
    $("#massScavengeSophie").draggable();
})();
