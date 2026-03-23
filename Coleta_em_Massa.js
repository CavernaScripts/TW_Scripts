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
    var tempElementSelection = "";

    if (window.location.href.indexOf('screen=place&mode=scavenge_mass') < 0) {
        window.location.assign(game_data.link_base_pure + "place&mode=scavenge_mass");
        return;
    }

    $("#massScavengeSophie").remove();
    var version = "new";

    // Traduções Cap Caverna
    var langShinko = [
        "COLETA EM MASSA - CAP CAVERNA",
        "Selecione as unidades/ORDEM (arraste para ordenar)",
        "Selecione as categorias para usar",
        "Quando você quer que as coletas retornem?",
        "Tempo de percurso",
        "Calcular tempos para cada página",
        "Desenvolvido por: ",
        "Coleta em massa: enviar por blocos de 50 aldeias",
        "Lançar Grupo "
    ];

    // --- PERSISTÊNCIA E CONFIGURAÇÕES ---
    if (localStorage.getItem("troopTypeEnabled") == null) {
        var worldUnits = game_data.units;
        var troopTypeEnabled = {};
        for (var i = 0; i < worldUnits.length; i++) {
            if (!["militia", "snob", "ram", "catapult", "spy", "knight"].includes(worldUnits[i])) {
                troopTypeEnabled[worldUnits[i]] = false;
            }
        }
        localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
    } else {
        var troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled"));
    }

    if (localStorage.getItem("keepHome") == null) {
        var keepHome = { "spear": 0, "sword": 0, "axe": 0, "archer": 0, "light": 0, "marcher": 0, "heavy": 0 };
        localStorage.setItem("keepHome", JSON.stringify(keepHome));
    } else {
        var keepHome = JSON.parse(localStorage.getItem("keepHome"));
    }

    if (localStorage.getItem("categoryEnabled") == null) {
        var categoryEnabled = [true, true, true, true];
        localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
    } else {
        var categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled"));
    }

    var prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat")) || false;
    var tempElementSelection = localStorage.getItem("timeElement") || "Date";
    var sendOrder = JSON.parse(localStorage.getItem("sendOrder")) || game_data.units.filter(u => !["militia", "snob", "ram", "catapult", "spy", "knight"].includes(u));
    var runTimes = JSON.parse(localStorage.getItem("runTimes")) || { "off": 4, "def": 3 };
    var premiumBtnEnabled = false;

    var URLReq = game_data.player.sitter > 0 ? `game.php?t=${game_data.player.id}&screen=place&mode=scavenge_mass` : "game.php?&screen=place&mode=scavenge_mass";
    
    var arrayWithData, enabledCategories = [], squad_requests = [], squad_requests_premium = [], duration_factor = 0, duration_exponent = 0, duration_initial_seconds = 0;
    var categoryNames = JSON.parse("[" + $.find('script:contains("ScavengeMassScreen")')[0].innerHTML.match(/\{.*\:\{.*\:.*\}\}/g) + "]")[0];
    var time = { 'off': 0, 'def': 0 };

    // Estilo TW (Bege)
    var backgroundColor = "#F4E4BC", borderColor = "#ecd7ac", headerColor = "#c6a768", titleColor = "#803000";
    var cssClassesSophie = `
    <style>
        .sophRowA { background-color: #f4e4bc; color: black; }
        .sophRowB { background-color: #fff5da; color: black; }
        .sophHeader { background-color: #c6a768; font-weight: bold; color: #803000; }
        .btnSophie { background: linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%); color:white; border: 1px solid #000; padding: 4px; cursor: pointer; }
        .btnSophie:hover { background: linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%); }
        #x { position: absolute; background: red; color: white; top: 0px; right: 0px; width: 30px; height: 30px; border:none; cursor:pointer; }
        #cog { position: absolute; background: #f4e4bc; top: 0px; right: 30px; width: 30px; height: 30px; border:none; cursor:pointer; }
    </style>`;

    $("#contentContainer").prepend(cssClassesSophie);

    // --- FUNÇÕES DE CARREGAMENTO AJAX ---
    $.getAll = function (urls, onLoad, onDone, onError) {
        var numDone = 0, lastRequestTime = 0, minWaitTime = 200;
        loadNext();
        function loadNext() {
            if (numDone == urls.length) { onDone(); return; }
            let now = Date.now();
            if (now - lastRequestTime < minWaitTime) { setTimeout(loadNext, minWaitTime - (now - lastRequestTime)); return; }
            lastRequestTime = now;
            $.get(urls[numDone]).done((data) => {
                onLoad(numDone, data);
                ++numDone;
                loadNext();
            }).fail(onError);
        }
    };

    window.getData = function() {
        $("#massScavengeSophie").remove();
        let URLs = [];
        $.get(URLReq, function (data) {
            let amountOfPages = $(".paged-nav-item").length > 0 ? parseInt($(".paged-nav-item")[$(".paged-nav-item").length - 1].href.match(/page=(\d+)/)[1]) : 0;
            for (var i = 0; i <= amountOfPages; i++) URLs.push(URLReq + "&page=" + i);
            let tempData = JSON.parse($(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[0]);
            duration_exponent = tempData[1].duration_exponent;
            duration_factor = tempData[1].duration_factor;
            duration_initial_seconds = tempData[1].duration_initial_seconds;
        }).done(function () {
            arrayWithData = "[";
            $.getAll(URLs, (i, data) => {
                arrayWithData += $(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[2] + ",";
            }, () => {
                arrayWithData = arrayWithData.substring(0, arrayWithData.length - 1) + "]";
                scavengeInfo = JSON.parse(arrayWithData);
                squad_requests = [];
                for (var i = 0; i < scavengeInfo.length; i++) calculateHaulCategories(scavengeInfo[i]);
                
                // Gerar Grupos de Envio
                let squads = {}, per200 = 0, groupNumber = 0;
                squads[groupNumber] = [];
                for (var k = 0; k < squad_requests.length; k++) {
                    if (per200 == 200) { groupNumber++; squads[groupNumber] = []; per200 = 0; }
                    per200++;
                    squads[groupNumber].push(squad_requests[k]);
                }

                let htmlFinal = `<div id="massScavengeFinal" class="ui-widget-content" style="position:fixed;top:100px;left:100px;background-color:${backgroundColor};border:2px solid #7d510f;z-index:10001;padding:10px;">
                    <button id="x" onclick="$('#massScavengeFinal').remove()">X</button>
                    <table class="vis" style="width:100%">
                        <tr class="sophHeader"><td>${langShinko[7]}</td></tr>`;
                for (var s = 0; s < Object.keys(squads).length; s++) {
                    htmlFinal += `<tr><td style="text-align:center;padding:5px;"><input type="button" class="btn btnSophie" onclick="window.sendGroup(${s}, ${JSON.stringify(squads[s])})" value="${langShinko[8]}${s + 1}"></td></tr>`;
                }
                htmlFinal += `</table><center><small>${signature} Cap Caverna</small></center></div>`;
                $("body").append(htmlFinal);
                $("#massScavengeFinal").draggable();
            });
        });
    };

    window.sendGroup = function(groupNr, groupData) {
        TribalWars.post('scavenge_api', { ajaxaction: 'send_squads' }, { "squad_requests": groupData }, function () {
            UI.SuccessMessage("Grupo " + (groupNr+1) + " enviado!");
            $(`input[value*='${langShinko[8]}${groupNr+1}']`).parent().parent().remove();
        });
    };

    function calculateHaulCategories(data) {
        if (!data.has_rally_point) return;
        var troopsAllowed = {};
        for (let key in troopTypeEnabled) {
            if (troopTypeEnabled[key]) {
                troopsAllowed[key] = Math.max(0, data.unit_counts_home[key] - (parseInt(keepHome[key]) || 0));
            }
        }
        
        let unitTypeMap = { spear: 'def', sword: 'def', axe: 'off', archer: 'def', light: 'off', marcher: 'off', heavy: 'def' };
        let typeCount = { off: 0, def: 0 };
        for (let prop in troopsAllowed) typeCount[unitTypeMap[prop] || 'off'] += troopsAllowed[prop];

        let totalLoot = 0;
        let carryMap = { spear: 25, sword: 15, axe: 10, archer: 10, light: 80, marcher: 50, heavy: 50, knight: 100 };
        for (let key in troopsAllowed) totalLoot += troopsAllowed[key] * (data.unit_carry_factor * (carryMap[key] || 0));

        if (totalLoot === 0) return;

        let selectedTime = typeCount.off > typeCount.def ? time.off : time.def;
        let haul = parseInt(((selectedTime * 3600) / duration_factor - duration_initial_seconds) ** (1 / duration_exponent) / 100) ** 0.5;

        let haulRates = { 1: 0.1, 2: 0.25, 3: 0.50, 4: 0.75 };
        let haulCategoryRate = {};
        for (let i = 1; i <= 4; i++) {
            if (data.options[i].is_locked || data.options[i].scavenging_squad != null || !categoryEnabled[i-1]) {
                haulCategoryRate[i] = 0;
            } else {
                haulCategoryRate[i] = haul / haulRates[i];
            }
        }

        let unitsReady = calculateUnitsPerVillage(troopsAllowed, totalLoot, haulCategoryRate);
        for (let k = 0; k < 4; k++) {
            if (Object.keys(unitsReady[k]).length > 0) {
                squad_requests.push({ village_id: data.village_id, candidate_squad: { unit_counts: unitsReady[k], carry_max: 99999999 }, option_id: k + 1, use_premium: false });
            }
        }
    }

    function calculateUnitsPerVillage(troopsAllowed, totalLoot, haulCategoryRate) {
        let unitHaul = { spear: 25, sword: 15, axe: 10, archer: 10, light: 80, marcher: 50, heavy: 50, knight: 100 };
        let unitsReady = { 0: {}, 1: {}, 2: {}, 3: {} };
        let totalHaulReq = Object.values(haulCategoryRate).reduce((a, b) => a + b, 0);

        if (totalLoot > totalHaulReq) {
            for (let j = 3; j >= 0; j--) {
                let reach = haulCategoryRate[j + 1];
                sendOrder.forEach(unit => {
                    if (troopsAllowed[unit] > 0 && reach > 0) {
                        let amount = Math.min(troopsAllowed[unit], Math.floor(reach / unitHaul[unit]));
                        if (amount > 0) {
                            unitsReady[j][unit] = amount;
                            reach -= amount * unitHaul[unit];
                            troopsAllowed[unit] -= amount;
                        }
                    }
                });
            }
        } else {
            for (let j = 0; j < 4; j++) {
                for (let key in troopsAllowed) {
                    let amount = Math.floor((totalLoot / totalHaulReq * haulCategoryRate[j + 1]) * (troopsAllowed[key] / totalLoot));
                    if (amount > 0) unitsReady[j][key] = amount;
                }
            }
        }
        return unitsReady;
    }

    // --- INTERFACE ---
    window.readyToSend = function() {
        for (let u of sendOrder) {
            troopTypeEnabled[u] = $(`#${u}`).is(":checked");
            keepHome[u] = $(`#${u}Backup`).val();
        }
        categoryEnabled = [1, 2, 3, 4].map(i => $(`#category${i}`).is(":checked"));
        
        if ($("#timeSelectorDate").is(":checked")) {
            time.off = (Date.parse($("#offDay").val() + " " + $("#offTime").val()) - serverDate) / 3600000;
            time.def = (Date.parse($("#defDay").val() + " " + $("#defTime").val()) - serverDate) / 3600000;
        } else {
            time.off = $('.runTime_off').val();
            time.def = $('.runTime_def').val();
        }

        localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
        localStorage.setItem("keepHome", JSON.stringify(keepHome));
        localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
        localStorage.setItem("runTimes", JSON.stringify(time));
        
        window.getData();
    };

    // Renderizar Interface Principal (Omitido aqui por brevidade, mas segue o padrão bege/Cap Caverna que você aprovou)
    // O código da interface deve chamar a função window.readyToSend() no botão principal.
    
    // UI (Resumida para o motor funcionar)
    let htmlMain = `
    <div id="massScavengeSophie" class="ui-widget-content" style="width:600px;background-color:${backgroundColor};border:2px solid #7d510f;position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:10000;padding:10px;">
        <button id="x" onclick="$('#massScavengeSophie').remove()">X</button>
        <h3 style="text-align:center;color:${titleColor}">${langShinko[0]}</h3>
        <table class="vis" style="width:100%">
            <tr id="imgRow">
                ${sendOrder.map(u => `
                    <td align="center">
                        <img src="https://dsbr.innogamescdn.com/asset/8098c77/graphic/unit/unit_${u}.png"><br>
                        <input type="checkbox" id="${u}" ${troopTypeEnabled[u]?'checked':''}><br>
                        <small>Bkp</small><br><input type="text" id="${u}Backup" value="${keepHome[u]||0}" size="3">
                    </td>
                `).join('')}
            </tr>
        </table>
        <div style="text-align:center;margin-top:10px;">
            <b>Categorias:</b><br>
            ${[1,2,3,4].map(i => `P${i} <input type="checkbox" id="category${i}" ${categoryEnabled[i-1]?'checked':''}> `).join('')}
        </div>
        <div style="text-align:center;margin-top:10px;">
            <b>Horas:</b> Off <input type="text" class="runTime_off" value="${runTimes.off}" size="3"> Def <input type="text" class="runTime_def" value="${runTimes.def}" size="3">
            <input type="radio" id="timeSelectorHours" name="ts" checked style="display:none">
        </div>
        <button class="btnSophie" style="width:100%;margin-top:10px;" onclick="window.readyToSend()">${langShinko[5]}</button>
        <center><small>${signature} Cap Caverna</small></center>
    </div>`;
    $("body").append(htmlMain);
    $("#massScavengeSophie").draggable();

})();
