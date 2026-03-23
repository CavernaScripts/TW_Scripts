javascript:
(function() {
    "use strict";

    if ($("#scavenge-pro-gui").length) return;

    const unitNames = {
        spear: "Lanceiro", sword: "Espadachim", axe: "Bárbaro", 
        archer: "Arqueiro", light: "Cavalaria Leve", marcher: "Arq. Cavalo", 
        heavy: "Cavalaria Pesada"
    };

    const html = `
    <div id="scavenge-pro-gui" style="position:fixed; top:10%; left:50%; transform:translateX(-50%); z-index:10000; background:#e1cda3; border:2px solid #7d510f; padding:10px; width:550px; font-family:Verdana; font-size:11px; box-shadow: 5px 5px 15px #000;">
        <h3 style="text-align:center; background:#7d510f; color:#fff; margin:-10px -10px 10px -10px; padding:8px;">Configurador de Coleta - Modelo Pro (Individual)</h3>
        
        <table class="vis" style="width:100%; border-spacing: 1px; border-collapse: separate; background:#d2c09e;">
            <thead>
                <tr class="vis">
                    ${Object.keys(unitNames).map(u => `<th style="text-align:center; width:14%"><img src="https://dsbr.innogamescdn.com/asset/8098c77/graphic/unit/unit_${u}.png" title="${unitNames[u]}"></th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    ${Object.keys(unitNames).map(u => `<td style="text-align:center"><input type="checkbox" class="unit-select" value="${u}" checked></td>`).join('')}
                </tr>
                <tr>
                    ${Object.keys(unitNames).map(u => `<td style="text-align:center; font-size:9px;">Backup<br><input type="number" class="unit-backup" data-unit="${u}" value="0" style="width:45px; font-size:10px;"></td>`).join('')}
                </tr>
            </tbody>
        </table>

        <div style="margin-top:10px; background:#f4e4bc; padding:10px; border:1px solid #7d510f; display: flex; justify-content: space-around; align-items: center;">
            <div>
                <b>Limite Total de Tropas:</b><br>
                <input type="number" id="limit-qty" value="5000" style="width:100px;">
            </div>
            <div>
                <b>Tempo Máx. (Horas):</b><br>
                <input type="number" id="limit-time" value="5" step="0.5" style="width:100px;">
            </div>
        </div>

        <div style="margin-top:10px; text-align:center; padding:5px; background:#d2c09e; border:1px solid #7d510f;">
            <b>Distribuição:</b><br>
            <label><input type="radio" name="dist-mode" value="balanced" checked> Balanceado (Todas as categorias)</label>
            <label style="margin-left:15px;"><input type="radio" name="dist-mode" value="priority"> Priorizar Altas (Extrema/Grande)</label>
        </div>

        <button id="run-scavenge" style="width:100%; margin-top:10px; padding:12px; background:#4b7d1e; color:#fff; font-weight:bold; border:1px solid #000; cursor:pointer; font-size:13px; text-shadow: 1px 1px 2px #000;">EXECUTAR COLETAS</button>
        <div style="text-align:right; margin-top:5px;">
            <a href="#" onclick="$('#scavenge-pro-gui').remove()" style="color:#8a1a1a; text-decoration:none; font-weight:bold;">[ FECHAR JANELA ]</a>
        </div>
    </div>`;

    $('body').append(html);

    $('#run-scavenge').click(function() {
        const settings = {
            limit: parseInt($('#limit-qty').val()),
            maxTime: parseFloat($('#limit-time').val()) * 3600,
            units: $('.unit-select:checked').map((i, el) => el.value).get(),
            backups: {},
            mode: $('input[name="dist-mode"]:checked').val()
        };

        // Captura os valores de backup individual
        $('.unit-backup').each(function() {
            settings.backups[$(this).attr('data-unit')] = parseInt($(this).val()) || 0;
        });
        
        $('#scavenge-pro-gui').fadeOut();
        iniciarColeta(settings);
    });

    function iniciarColeta(conf) {
        const weights = [15, 6, 3, 2];
        const unlocked = weights.length - $(".unlock-button").length;
        const availableBtns = $(".free_send_button");

        let totalParaUsar = 0;
        let tropasFinais = [];

        $(".units-entry-all").each(function() {
            const unit = $(this).attr("data-unit");
            if (conf.units.includes(unit)) {
                let disponivelNaAldeia = parseInt($(this).text().replace(/\D/g, ""));
                let backup = conf.backups[unit] || 0;
                
                // Só usamos o que exceder o backup
                let utilizavel = Math.max(0, disponivelNaAldeia - backup);
                
                if (utilizavel > 0) {
                    tropasFinais.push({ unit: unit, qty: utilizavel });
                    totalParaUsar += utilizavel;
                }
            }
        });

        // Se o limite total for menor que o que sobrou após o backup, aplicamos proporção
        if (conf.limit < totalParaUsar) {
            const fator = conf.limit / totalParaUsar;
            tropasFinais.forEach(t => t.qty = Math.floor(t.qty * fator));
            totalParaUsar = conf.limit;
        }

        const activeWeights = weights.slice(0, unlocked);
        const totalWeight = activeWeights.reduce((a, b) => a + b, 0);

        // Execução das coletas disponíveis
        availableBtns.each(function(index) {
            if (index >= unlocked) return;

            const btn = $(this);
            const weight = weights[index];

            setTimeout(() => {
                tropasFinais.forEach(t => {
                    let qtdParaEnviar = Math.floor((t.qty * weight) / totalWeight);
                    
                    if (qtdParaEnviar > 0) {
                        $(`input[name='${t.unit}']`).val(qtdParaEnviar).trigger("change");
                    }
                });

                // Clique final para enviar a categoria
                setTimeout(() => btn.click(), 400);

            }, (index * 1500) + Math.random() * 500);
        });
    }
})();
