javascript:(function(){
    const ID_CFG = 'cfg_m_v25';
    const CLASSE_BTN = 'btn-m-v25';
    
    /* 1. Limpeza de Segurança */
    if(document.getElementById(ID_CFG)) document.getElementById(ID_CFG).remove();

    /* 2. Interface de Configuração */
    const tb = document.querySelector('#content_value table.vis tbody');
    if(tb){
        const tr = document.createElement('tr');
        tr.id = ID_CFG;
        tr.innerHTML = `
            <td style="text-align:center;"><img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_ram.png" width="20"></td>
            <td colspan="30" style="padding:10px; background:#f4e4bc; border:1px solid #3b240b; position: relative;">
                <b style="font-size: 14px;">Muralha BB</b>
                <div style="margin-top:5px;">
                    <img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_axe.png"> 
                    <input id="m_axe" type="number" value="50" style="width:45px; text-align:center;"> 
                    &nbsp;&nbsp;
                    <img src="https://dsbr.innogamescdn.com/asset/8987b7a2/graphic/unit/unit_ram.png"> 
                    <input id="m_ram" type="number" value="10" style="width:45px; text-align:center;"> 
                </div>
                <div style="position: absolute; bottom: 5px; right: 10px; font-style: italic; font-size: 10px; color: #8b4513;">
                    by Cap Caverna
                </div>
            </td>`;
        tb.prepend(tr);
    }

    /* 3. Lógica de Ataque (Janela Lateral) */
    function dispararM(coords, btn, row) {
        if (!coords || btn.dataset.loading === 'true') return;
        
        btn.dataset.loading = 'true';
        btn.innerHTML = "...";
        btn.style.background = "#555";

        const axeVal = document.getElementById('m_axe').value;
        const ramVal = document.getElementById('m_ram').value;

        const win = window.open(`/game.php?village=${window.game_data.village.id}&screen=place`, 'ataque_m', 'width=500,height=600');

        const verificador = setInterval(() => {
            try {
                if (!win || win.closed) { clearInterval(verificador); return; }

                const doc = win.document;
                const confirmBtn = doc.getElementById('troop_confirm_submit');
                const form = doc.getElementById('command-data-form');
                const erro = doc.querySelector('.error_box');

                if (erro) {
                    UI.ErrorMessage(erro.innerText.trim());
                    win.close();
                    clearInterval(verificador);
                    btn.innerHTML = "!";
                    btn.dataset.loading = 'false';
                    return;
                }

                if (confirmBtn) {
                    confirmBtn.click();
                    clearInterval(verificador);
                    setTimeout(() => {
                        win.close();
                        btn.innerHTML = "OK";
                        btn.style.background = "#21881e";
                        row.style.opacity = "0.4";
                        UI.SuccessMessage(`Muralha BB enviada para ${coords}`);
                    }, 500);
                } 
                else if (form && doc.querySelector('input.target-input-field')) {
                    doc.querySelector('input.target-input-field').value = coords;
                    doc.getElementById('unit_input_axe').value = axeVal;
                    doc.getElementById('unit_input_ram').value = ramVal;
                    setTimeout(() => {
                        const btnAtacar = doc.getElementById('target_attack');
                        if (btnAtacar) btnAtacar.click();
                    }, 300);
                }
            } catch (e) {}
        }, 500);
    }

    /* 4. Injeção Visual na Tabela */
    function atualizarTabela() {
        const table = document.getElementById('plunder_list');
        if (!table) return;

        if (!document.getElementById('m_head_v25')) {
            const headerRow = table.rows[0];
            const th = document.createElement('th');
            th.id = 'm_head_v25';
            th.rowSpan = "2";
            th.textContent = 'M';
            th.style.textAlign = 'center';
            headerRow.insertBefore(th, headerRow.cells[headerRow.cells.length - 1]);
        }

        table.querySelectorAll('tr[id^="village_"]').forEach(row => {
            if (row.querySelector('.' + CLASSE_BTN)) return;
            const linkRelatorio = row.querySelector('a[href*="screen=report"]');
            if (!linkRelatorio) return;
            const coordsMatch = linkRelatorio.innerText.match(/\d{3}\|\d{3}/);
            if (!coordsMatch) return;

            const cell = row.insertCell(row.cells.length - 1);
            cell.style.textAlign = 'center';
            const a = document.createElement('a');
            a.className = CLASSE_BTN;
            a.innerHTML = 'M';
            a.style.cssText = 'display:inline-block; padding:3px 8px; background:#8b4513; color:#fff; border-radius:3px; cursor:pointer; font-weight:bold; text-decoration:none; border:1px solid #3b240b;';
            a.onclick = () => dispararM(coordsMatch[0], a, row);
            cell.appendChild(a);
        });
    }

    atualizarTabela();
    setInterval(atualizarTabela, 3000);
})();
