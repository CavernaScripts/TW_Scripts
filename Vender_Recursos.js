javascript:(function () {
    'use strict';
    console.log("Ge: Iniciando assistente de venda de recursos...");

    // Função de auxílio para números
    const limparNum = (texto) => parseInt(texto.replace(/\./g, '')) || 0;

    // 1. Coleta de Dados da Página (Bolsa Premium)
    const dados = {
        transporte: limparNum($("#market_merchant_max_transport").text()),
        aldeia: {
            wood: limparNum($("#wood").text()),
            stone: limparNum($("#stone").text()),
            iron: limparNum($("#iron").text())
        },
        bolsa: {
            capWood: limparNum($("#premium_exchange_capacity_wood").text()),
            capStone: limparNum($("#premium_exchange_capacity_stone").text()),
            capIron: limparNum($("#premium_exchange_capacity_iron").text()),
            stockWood: limparNum($("#premium_exchange_stock_wood").text()),
            stockStone: limparNum($("#premium_exchange_stock_stone").text()),
            stockIron: limparNum($("#premium_exchange_stock_iron").text())
        }
    };

    // 2. Função de Cálculo de Custo (Baseada na lógica do jogo)
    function obterCusto(tipo) {
        try {
            const data = unsafeWindow.PremiumExchange.data;
            const marginal = unsafeWindow.PremiumExchange.calculateMarginalPrice(data.stock[tipo], data.capacity[tipo]);
            return Math.floor(1 / marginal);
        } catch (e) {
            // Fallback caso a API do jogo não responda
            return 600; 
        }
    }

    const custos = {
        wood: obterCusto("wood"),
        stone: obterCusto("stone"),
        iron: obterCusto("iron")
    };

    // 3. Lógica de quanto vender (Garantindo que a bolsa tenha espaço)
    function calcVenda(tipo) {
        let disponivelBolsa = dados.bolsa["cap" + tipo.charAt(0).toUpperCase() + tipo.slice(1)] - dados.bolsa["stock" + tipo.charAt(0).toUpperCase() + tipo.slice(1)];
        let podeVender = Math.floor(dados.aldeia[tipo] / custos[tipo]) * custos[tipo];
        
        // Limita pela capacidade da bolsa e pelos mercadores (menos uma margem de segurança)
        let final = Math.min(podeVender, disponivelBolsa, dados.transporte - 100);
        return final > 0 ? final : 0;
    }

    const venda = {
        wood: calcVenda("wood"),
        stone: calcVenda("stone"),
        iron: calcVenda("iron")
    };

    // 4. Interface de Execução (Para evitar gastos acidentais)
    const id = "ge_venda_popup";
    if(document.getElementById(id)) document.getElementById(id).remove();

    const box = document.createElement("div");
    box.id = id;
    box.style = "position:fixed;top:20%;left:40%;width:300px;background:#f4e4bc;border:3px solid #3b240b;z-index:999999;border-radius:10px;padding:15px;font-family:Verdana;box-shadow:0 0 20px rgba(0,0,0,0.5);";
    
    box.innerHTML = `
        <h3 style="font-size:14px;text-align:center;margin:0 0 10px 0;">RECUPERAÇÃO DE PPs</h3>
        <p style="font-size:11px;"><b>Preços atuais (Recursos por 1 PP):</b><br>
        Madeira: ${custos.wood} | Argila: ${custos.stone} | Ferro: ${custos.iron}</p>
        <hr>
        <div style="font-size:12px;">
            Sugestão de Venda:<br>
            - Madeira: <b>${venda.wood}</b><br>
            - Argila: <b>${venda.stone}</b><br>
            - Ferro: <b>${venda.iron}</b>
        </div>
        <button id="btnVenderTudo" style="width:100%;margin-top:10px;background:#21881e;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;font-weight:bold;">VENDER MELHOR OFERTA</button>
        <button onclick="this.parentElement.remove()" style="width:100%;margin-top:5px;background:#8b211e;color:#fff;border:none;padding:5px;border-radius:5px;cursor:pointer;">CANCELAR</button>
    `;
    document.body.appendChild(box);

    document.getElementById("btnVenderTudo").onclick = function() {
        if(venda.iron > 0) $("input[name='sell_iron']").val(venda.iron);
        else if(venda.stone > 0) $("input[name='sell_stone']").val(venda.stone);
        else if(venda.wood > 0) $("input[name='sell_wood']").val(venda.wood);

        setTimeout(() => {
            $(".btn-premium-exchange-buy").click();
            console.log("Ge: Oferta enviada. Verifique a confirmação na tela.");
            box.remove();
        }, 500);
    };

})();
