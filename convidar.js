javascript:(function(){
    /* Verificação de Página */
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('screen') !== 'ally' || urlParams.get('mode') !== 'invite') {
        if(confirm("Para gerenciar o limite de membros e convites enviados, o script deve rodar na página de Recrutamento. Ir para lá?")) {
            window.location.href = window.location.origin + "/game.php?screen=ally&mode=invite";
        }
        return;
    }

    const id = "ra_invite_k_filter";
    if(document.getElementById(id)) document.getElementById(id).remove();

    const box = document.createElement("div");
    box.id = id;
    box.style = "position:fixed;top:10%;left:25%;width:680px;background:#f4e4bc;border:3px solid #3b240b;z-index:999999;border-radius:10px;padding:15px;font-family:Verdana;box-shadow:0 0 20px rgba(0,0,0,0.7);";
    box.innerHTML = `
        <div style="background:#3b240b;color:#fff;padding:10px;font-weight:bold;text-align:center;border-radius:5px 5px 0 0;">
            RECRUTAMENTO INTELIGENTE
            <span style="float:right;cursor:pointer;" onclick="this.parentElement.parentElement.remove()">✖</span>
        </div>
        <div style="padding:10px; background:#fff; border:1px solid #3b240b;">
            <div id="msg_alerta" style="display:none; background:#fcf8e3; color:#8a6d3b; padding:10px; margin-bottom:10px; border:1px solid #faebcc; border-radius:4px; font-weight:bold; text-align:center; font-size:12px;"></div>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input id="f_name" type="text" placeholder="Nome..." style="flex:2; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input id="f_k" type="number" placeholder="K" style="flex:0.8; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input id="f_ally" type="text" placeholder="Tribo (Vazio = N/A)" style="flex:2; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div id="p_lista" style="max-height:350px; overflow-y:auto; min-height:100px;">Sincronizando dados...</div>
            <div style="margin-top:10px; font-size:9px; color:#666; text-align:right; font-style:italic;">
                Desenvolvido por: Cap Caverna
            </div>
        </div>
    `;
    document.body.appendChild(box);

    const listaArea = document.getElementById("p_lista");
    const alertaBox = document.getElementById("msg_alerta");

    async function iniciar() {
        try {
            /* Check de Limite de Membros na Página original */
            const infoJogo = document.querySelector(".error, .error_box, .info_box");
            if (infoJogo && (infoJogo.innerText.includes("60 membros") || infoJogo.innerText.includes("exceder o máximo"))) {
                bloquearRecrutamento("AVISO: Limite de membros ou convites excedido pela tribo.");
            }

            const convidadosSet = new Set();
            document.querySelectorAll('#invitations_table a[href*="screen=info_player"]').forEach(link => {
                const url = new URLSearchParams(link.href.split('?')[1]);
                const pId = url.get('id');
                if(pId) convidadosSet.add(pId);
            });

            const [resP, resV, resA] = await Promise.all([
                fetch('/map/player.txt').then(r => r.text()),
                fetch('/map/village.txt').then(r => r.text()),
                fetch('/map/ally.txt').then(r => r.text())
            ]);

            const players = resP.trim().split('\n').map(line => line.split(','));
            const villages = resV.trim().split('\n').map(line => line.split(','));
            const allies = resA.trim().split('\n').map(line => line.split(','));

            let allyMap = {};
            allies.forEach(a => { allyMap[a[0]] = decodeURIComponent(a[2].replace(/\+/g, ' ')); });

            let playerKMap = {};
            villages.forEach(v => {
                const pId = v[4];
                if (pId !== "0" && !playerKMap[pId]) {
                    const x = parseInt(v[2]); const y = parseInt(v[3]);
                    playerKMap[pId] = Math.floor(y / 100) * 10 + Math.floor(x / 100);
                }
            });

            function filtrar() {
                const nomeInput = document.getElementById("f_name").value.toLowerCase();
                const kInput = document.getElementById("f_k").value.trim();
                const allyInput = document.getElementById("f_ally").value.trim().toLowerCase();
                
                const filtrados = players.filter(p => {
                    const pId = p[0];
                    const pName = decodeURIComponent(p[1].replace(/\+/g, ' ')).toLowerCase();
                    const pK = playerKMap[pId];
                    const pAllyId = p[2];
                    const pAllyTag = (pAllyId === "0" ? "" : (allyMap[pAllyId] || "")).toLowerCase();

                    return pName.includes(nomeInput) && (kInput === "" || pK == kInput) && 
                           (allyInput === "" ? pAllyId === "0" : pAllyTag.includes(allyInput)) && 
                           !convidadosSet.has(pId);
                }).sort((a, b) => parseInt(a[5]) - parseInt(b[5])).slice(0, 50);

                let html = `<table width="100%" style="font-size:11px; border-collapse:collapse;">
                    <thead><tr style="background:#eee; text-align:left;">
                        <th style="padding:5px;">Rank</th><th style="padding:5px;">Jogador</th><th style="padding:5px; text-align:center;">K</th>
                        <th style="padding:5px; text-align:center;">Pontos</th><th style="padding:5px;">Tribo</th><th style="padding:5px; text-align:center;">Ação</th>
                    </tr></thead><tbody>`;
                
                filtrados.forEach(p => {
                    const pId = p[0];
                    const estaBloqueado = alertaBox.style.display === "block";
                    html += `<tr id="row_${pId}" style="border-bottom:1px solid #ddd;">
                        <td style="padding:5px; text-align:center;">${p[5]}</td>
                        <td style="padding:5px;"><a href="/game.php?screen=info_player&id=${pId}" target="_blank" style="color:#3b240b; font-weight:bold;">${decodeURIComponent(p[1].replace(/\+/g, ' '))}</a></td>
                        <td style="padding:5px; text-align:center;">K${playerKMap[pId] || '--'}</td>
                        <td style="padding:5px; text-align:center; font-weight:bold; color:#21881e;">${parseInt(p[4]).toLocaleString()}</td>
                        <td style="padding:5px;">${allyMap[p[2]] || "<b style='color:#d9534f;'>N/A</b>"}</td>
                        <td style="padding:5px; text-align:center;">
                            <button class="btn_convidar" onclick="executarConvite('${pId}', this)" ${estaBloqueado ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : 'style="cursor:pointer; background:#21881e; color:#fff; border:none; padding:4px 8px; border-radius:3px;"'}>Convidar</button>
                        </td>
                    </tr>`;
                });
                listaArea.innerHTML = filtrados.length > 0 ? html + "</tbody></table>" : "<div style='padding:20px; text-align:center;'>Nenhum jogador disponível para os critérios.</div>";
            }

            document.getElementById("f_name").oninput = filtrar;
            document.getElementById("f_k").oninput = filtrar;
            document.getElementById("f_ally").oninput = filtrar;
            filtrar();

        } catch (e) {
            listaArea.innerHTML = "Erro ao carregar dados.";
        }
    }

    /* Função para travar a interface */
    function bloquearRecrutamento(mensagem) {
        alertaBox.innerText = mensagem;
        alertaBox.style.display = "block";
        document.querySelectorAll(".btn_convidar").forEach(b => {
            b.disabled = true;
            b.style.opacity = "0.5";
            b.style.cursor = "not-allowed";
        });
    }

    window.executarConvite = function(id, btn) {
        const h = window.game_data.csrf;
        btn.innerText = "...";
        btn.disabled = true;
        
        fetch(`/game.php?screen=ally&mode=invite&action=invite_id&id=${id}&h=${h}`)
            .then(response => response.text())
            .then(txt => {
                if (txt.includes("não pode exceder o máximo de 60 membros") || txt.includes("não pode enviar mais convites")) {
                    bloquearRecrutamento("AVISO: O limite de 60 membros/convites foi atingido.");
                    btn.innerText = "Limite";
                } else {
                    const row = document.getElementById(`row_${id}`);
                    if(row) {
                        row.style.background = "#dff0d8";
                        setTimeout(() => row.remove(), 300);
                    }
                }
            });
    };

    iniciar();
})();
