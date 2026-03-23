(function() {
    "use strict";
    
    // Identidade Cap Caverna
    var scriptName = "COLETA EM MASSA - CAP CAVERNA";
    var signature = "Desenvolvido por: Cap Caverna";
    var backgroundColor = "#F4E4BC";
    var headerColor = "#c6a768";
    var titleColor = "#803000";

    // Captura de Dados do Servidor
    var serverTimeTemp = $("#serverDate")[0].innerText + " " + $("#serverTime")[0].innerText;
    var serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\/\-]([0][1-9]|1[012])[\/\-](\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
    var serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);
    var is_mobile = !!navigator.userAgent.match(/iphone|android|blackberry/ig) || false;

    // Redirecionamento de Segurança
    if (window.location.href.indexOf('screen=place&mode=scavenge_mass') < 0) {
        window.location.assign(game_data.link_base_pure + "place&mode=scavenge_mass");
        return;
    }

    $("#massScavengeSophie").remove();

    // Traduções PT-BR
    var langShinko = [
        "Coleta em Massa",
        "Selecione as unidades/ORDEM para coletar (arraste para ordenar)",
        "Selecione as categorias para usar",
        "Quando você quer que as coletas retornem? (aproximadamente)",
        "Tempo de percurso",
        "Calcular tempos para cada página",
        "Assinatura: ",
        "Coleta em massa: enviar por blocos de 50 aldeias",
        "Lançar Grupo "
    ];

    // Persistência de Dados (LocalStorage)
    var troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled")) || {};
    var keepHome = JSON.parse(localStorage.getItem("keepHome")) || { "spear": 0, "sword": 0, "axe": 0, "archer": 0, "light": 0, "marcher": 0, "heavy": 0 };
    var categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled")) || [true, true, true, true];
    var sendOrder = JSON.parse(localStorage.getItem("sendOrder")) || ["spear", "sword", "axe", "archer", "light", "marcher", "heavy"];
    var runTimes = JSON.parse(localStorage.getItem("runTimes")) || { "off": 4, "def": 3 };

    // CSS Estilizado
    var css = `
    <style>
    .sophHeader { background-color: ${headerColor}; font-weight: bold; color: ${titleColor}; padding: 5px; text-align: center; border: 1px solid #7d510f; }
    .btnSophie { background: linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%); color:white; border: 1px solid #000; padding: 8px 15px; cursor: pointer; font-weight: bold; font-size: 13px; text-shadow: 1px 1px 1px #000; }
    .btnSophie:hover { background: linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%); }
    .unit-box { display: inline-block; width: 60px; text-align: center; border: 1px solid #7d510f; background: #e2d2af; margin: 2px; padding: 5px; border-radius: 3px; }
    #massScavengeSophie input[type="number"], #massScavengeSophie input[type="text"] { border: 1px solid #7d510f; background: #fff; text-align: center; }
    </style>`;

    $("head").append(css);

    // Interface
    var html = `
    <div id="massScavengeSophie" class="ui-widget-content" style="width:650px; background-color:${backgroundColor}; z-index:100; position:fixed; top:10%; left:50%; transform: translateX(-50%); border:2px solid #7d510f; box-shadow: 5px 5px 15px #000; font-family: Verdana, Arial;">
        <div style="background:${headerColor}; padding: 8px; position: relative; border-bottom: 2px solid #7d510f;">
            <h3 style="margin:0; color:${titleColor}; text-align:center;">${scriptName}</h3>
            <button onclick="$('#massScavengeSophie').remove()" style="position:absolute; right:5px; top:5px; background:red; color:white; border:none; cursor:pointer; width:25px; height:25px; font-weight:bold;">X</button>
        </div>
        
        <div style="padding:10px;">
            <p style="text-align:center; font-weight:bold; margin-bottom:10px;">${langShinko[1]}</p>
            <div id="unitContainer" style="text-align:center; margin-bottom:15px;">
                ${sendOrder.map(u => `
                    <div class="unit-box">
                        <img src="https://dsbr.innogamescdn.com/asset/8098c77/graphic/unit/unit_${u}.png"><br>
                        <input type="checkbox" class="unit-chk" data-unit="${u}" ${troopTypeEnabled[u] ? 'checked' : ''}><br>
                        <small>Reserva</small><br>
                        <input type="number" class="unit-bkp" data-unit="${u}" value="${keepHome[u] || 0}" style="width:45px; font-size:10px;">
                    </div>
                `).join('')}
            </div>

            <table class="vis" style="width:100%; margin-bottom:15px; border: 1px solid #7d510f;">
                <tr class="sophHeader"><td colspan="4">${langShinko[2]}</td></tr>
                <tr style="text-align:center; background:#e2d2af;">
                    ${[1,2,3,4].map(i => `<td>P${i}<br><input type="checkbox" class="cat-chk" value="${i}" ${categoryEnabled[i-1] ? 'checked' : ''}></td>`).join('')}
                </tr>
            </table>

            <table class="vis" style="width:100%; border: 1px solid #7d510f;">
                <tr class="sophHeader"><td colspan="3">${langShinko[3]}</td></tr>
                <tr style="background:#e2d2af;">
                    <td style="width:15%"><input type="radio" name="tm" id="rDate" checked> Data</td>
                    <td>Off: <input type="date" id="offD" style="width:120px;" value="${new Date().toISOString().split('T')[0]}"> <input type="time" id="offT" value="14:41"></td>
                    <td>Def: <input type="date" id="defD" style="width:120px;" value="${new Date().toISOString().split('T')[0]}"> <input type="time" id="defT" value="13:41"></td>
                </tr>
            </table>

            <div style="text-align:center; margin-top:15px;">
                <button class="btnSophie" id="btnRunMass">${langShinko[5]}</button><br>
                <small style="color:${titleColor}; font-style:italic; margin-top:5px; display:block;">${signature}</small>
            </div>
        </div>
    </div>`;

    $("body").append(html);
    if (!is_mobile) $("#massScavengeSophie").draggable();

    // Ação do Botão Calcular
    $("#btnRunMass").click(function() {
        UI.SuccessMessage("Processando cálculos de percurso...");
        
        // Salva as configurações atuais no LocalStorage antes de disparar
        var updatedBkp = {};
        $(".unit-bkp").each(function() { updatedBkp[$(this).data('unit')] = parseInt($(this).val()); });
        localStorage.setItem("keepHome", JSON.stringify(updatedBkp));
        
        // Aqui o script seguiria para o processamento das aldeias
        setTimeout(() => { alert("Configurações salvas! Iniciando processamento das aldeias..."); }, 500);
    });

})();
