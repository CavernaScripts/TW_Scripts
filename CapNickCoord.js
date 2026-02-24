javascript: (function() {
    const idMenu = 'sjp_clean_capture';
    if (document.getElementById(idMenu)) { document.getElementById(idMenu).remove(); return; }

    const style = document.createElement('style');
    style.innerHTML = `
        #${idMenu} { position: fixed; top: 60px; right: 20px; width: 380px; background: #f4e4bc; border: 2px solid #3b240b; border-radius: 4px; z-index: 100000; padding: 15px; font-family: Verdana; box-shadow: 5px 5px 20px rgba(0,0,0,0.6); }
        .sjp_header { display: flex; justify-content: space-between; align-items: center; background: #3b240b; margin: -15px -15px 10px -15px; padding: 5px 15px; border-radius: 4px 4px 0 0; }
        .sjp_title { font-weight: bold; color: white; font-size: 13px; }
        .sjp_close { color: white; cursor: pointer; font-weight: bold; font-size: 16px; text-decoration: none; }
        .sjp_close:hover { color: #ff0000; }
        .sjp_area { width: 100%; height: 180px; margin-top: 10px; font-size: 11px; border: 1px solid #7d510f; background: #fff; white-space: pre; overflow-y: scroll; padding: 5px; box-sizing: border-box; }
        .sjp_opt { margin: 10px 0; display: flex; align-items: center; font-size: 11px; font-weight: bold; color: #3b240b; }
        .sjp_opt input { margin-right: 8px; cursor: pointer; }
        .sjp_grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px; }
        .sjp_btn { padding: 10px; background: #7d510f; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 3px; font-size: 10px; text-transform: uppercase; }
        .sjp_btn:hover { background: #3b240b; }
        .sjp_copy { background: #006400; grid-column: span 2; }
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = idMenu;
    menu.innerHTML = `
        <div class="sjp_header">
            <div class="sjp_title">Captura de Nick e Coordenadas</div>
            <div id="sjp_close_btn" class="sjp_close" title="Fechar">×</div>
        </div>
        <textarea id="sjp_out" class="sjp_area" placeholder="Os dados capturados aparecerão aqui..."></textarea>
        
        <div class="sjp_opt">
            <input type="checkbox" id="chk_bb"> <label for="chk_bb">Incluir Código BB</label>
        </div>

        <div class="sjp_grid">
            <button id="btn_n" class="sjp_btn">Captura de Nick</button>
            <button id="btn_c" class="sjp_btn">Coordenadas</button>
            <button id="btn_cp" class="sjp_btn sjp_copy">Copiar Tudo</button>
        </div>
    `;
    document.body.appendChild(menu);

    const out = document.getElementById('sjp_out');
    const bb = document.getElementById('chk_bb');

    /* Função para fechar o painel */
    document.getElementById('sjp_close_btn').onclick = function() {
        document.getElementById(idMenu).remove();
    };

    document.getElementById('btn_n').onclick = function() {
        let nicks = [];
        const ignore = ["perfil", "mensagem", "amigo", "escrever", "bloquear", "relatórios", "aldeias", "tribo", "exportar"];
        document.querySelectorAll('a').forEach(el => {
            let h = el.getAttribute('href') || '';
            let t = el.innerText.trim();
            if (h.includes('screen=info_player') && t.length > 0) {
                if (!ignore.some(x => t.toLowerCase().includes(x)) && !nicks.includes(t)) {
                    nicks.push(bb.checked ? `[player]${t}[/player]` : t);
                }
            }
        });
        out.value = nicks.join('\n');
    };

    document.getElementById('btn_c').onclick = function() {
        let coords = [];
        const regex = /(\d{3}\|\d{3})/g;
        const text = document.body.innerText;
        let m;
        while ((m = regex.exec(text)) !== null) {
            if (!coords.includes(m[1])) {
                coords.push(bb.checked ? `[coord]${m[1]}[/coord]` : m[1]);
            }
        }
        out.value = coords.join('\n');
    };

    document.getElementById('btn_cp').onclick = function() {
        out.select();
        document.execCommand('copy');
        UI.InfoMessage('Copiado!', 2000, 'success');
    };
})();
