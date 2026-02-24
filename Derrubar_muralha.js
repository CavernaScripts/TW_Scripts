javascript:(function(){

    const idConfig = "config_row_m_v7";

    if(document.getElementById(idConfig)) document.getElementById(idConfig).remove();



    console.log("%c [Farm Estratégico] Ativo - Desenvolvedor: Cap Caverna ", "background: #3b240b; color: #fff; font-weight: bold;");



    /* 1. Criar a interface de configuração no topo */

    const settingsTable = document.querySelector("#content_value table.vis");

    if (settingsTable) {

        const configRow = document.createElement("tr");

        configRow.id = idConfig;

        configRow.innerHTML = `

            <td style="text-align:center;"><img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_ram.png" width="20"></td>

            <td colspan="20" style="padding:10px; background:#f4e4bc; border:1px solid #3b240b;">

                <b>Modelo M (Demolição Automática):</b> 

                <input id="m_axe" type="number" value="50" style="width:45px; text-align:center;"> <img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_axe.png">

                <input id="m_ram" type="number" value="10" style="width:45px; text-align:center;"> <img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_ram.png">

                <span style="font-size:10px; margin-left:20px; color:#3b240b;">Dev: <b>Cap Caverna</b></span>

            </td>

        `;

        settingsTable.querySelector("tbody").appendChild(configRow);

    }



    /* 2. Injetar a coluna e o botão M */

    function atualizarInterface() {

        const table = document.getElementById("plunder_list");

        if (!table) return;



        if (!document.getElementById("header_m_col")) {

            const headerRow = table.rows[0];

            const th = document.createElement("th");

            th.id = "header_m_col";

            th.innerHTML = "M";

            th.style.textAlign = "center";

            headerRow.insertBefore(th, headerRow.cells[headerRow.cells.length - 1]);

        }



        const rows = table.querySelectorAll("tr[id^='village_']");

        rows.forEach(row => {

            if (!row.querySelector(".btn-muralha-v7")) {

                const lastCell = row.cells.length - 1;

                const newCell = row.insertCell(lastCell);

                newCell.style.textAlign = "center";

                

                const btnM = document.createElement("a");

                btnM.className = "btn-muralha-v7 farm_icon farm_icon_m";

                btnM.innerHTML = "M";

                btnM.style = "display:inline-block; padding:3px 8px; background:#8b4513; color:#fff; border-radius:3px; cursor:pointer; font-weight:bold; text-decoration:none; border: 1px solid #3b240b;";

                

                const targetId = row.id.split('_')[1];

                btnM.onclick = function() { processarAtaqueSilencioso(targetId, btnM, row); };

                newCell.appendChild(btnM);

            }

        });

    }



    /* 3. Lógica de Iframe para Envio sem sair da página */

    function processarAtaqueSilencioso(targetId, btn, row) {

        btn.innerHTML = "...";

        btn.style.background = "#555";

        

        const axe = document.getElementById("m_axe").value;

        const ram = document.getElementById("m_ram").value;



        /* Cria um iframe temporário e invisível */

        const ifrName = "ifr_" + targetId;

        let ifr = document.createElement("iframe");

        ifr.name = ifrName;

        ifr.style.display = "none";

        document.body.appendChild(ifr);



        /* Passo 1: Carrega a praça no iframe */

        const urlPraca = `/game.php?village=${window.game_data.village.id}&screen=place&target=${targetId}`;

        

        ifr.onload = function() {

            const doc = ifr.contentDocument || ifr.contentWindow.document;

            const form = doc.getElementById("command-data-form");



            if (form && !ifr.dataset.step) {

                /* Passo 2: Preencher e Atacar */

                ifr.dataset.step = "confirm";

                doc.getElementById("unit_input_axe").value = axe;

                doc.getElementById("unit_input_ram").value = ram;

                doc.getElementById("target_attack").click();

            } else if (form && ifr.dataset.step === "confirm") {

                /* Passo 3: Confirmar e Fechar */

                ifr.dataset.step = "done";

                doc.getElementById("troop_confirm_submit").click();

                

                /* Finalização */

                setTimeout(() => {

                    btn.innerHTML = "OK";

                    btn.style.background = "#21881e";

                    row.style.opacity = "0.4";

                    UI.SuccessMessage("Muralha em demolição!");

                    document.body.removeChild(ifr);

                }, 500);

            } else if (doc.querySelector(".error_box")) {

                UI.ErrorMessage(doc.querySelector(".error_box").innerText);

                btn.innerHTML = "!";

                btn.style.background = "#d9534f";

                document.body.removeChild(ifr);

            }

        };



        ifr.src = urlPraca;

    }



    atualizarInterface();

    setInterval(atualizarInterface, 2500);

})();
