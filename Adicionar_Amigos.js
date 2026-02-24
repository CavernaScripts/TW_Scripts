javascript:(function(){
    const id = "ge_friend_request_k";
    if(document.getElementById(id)) document.getElementById(id).remove();

    const box = document.createElement("div");
    box.id = id;
    box.style = "position:fixed;top:10%;left:30%;width:550px;background:#f4e4bc;border:3px solid #3b240b;z-index:999999;border-radius:10px;padding:15px;font-family:Verdana;box-shadow:0 0 20px rgba(0,0,0,0.7);";
    box.innerHTML = `
        <div style="background:#3b240b;color:#fff;padding:10px;font-weight:bold;text-align:center;border-radius:5px 5px 0 0;">
            SOLICITAÇÃO DE AMIZADE INTELIGENTE
            <span style="float:right;cursor:pointer;" onclick="this.parentElement.parentElement.remove()">✖</span>
        </div>
        <div style="padding:10px; background:#fff; border:1px solid #3b240b;">
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input id="f_name" type="text" placeholder="Nome do Jogador..." style="flex:2; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input id="f_k" type="number" placeholder="K" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <input id="f_ally" type="text" placeholder="Tag da Tribo" style="flex:1.5; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div id="p_lista" style="max-height:350px; overflow-y:auto; min-height:100px;">Sincronizando amigos e vizinhos...</div>
            <div style="margin-top:10px; font-size:9px; color:#666; text-align:right; font-style:italic;">
                Desenvolvido por: Cap Caverna
            </div>
        </div>
    `;
    document.body.appendChild(box);

    const listaArea = document.getElementById("p_lista");

    async function iniciar() {
        console.log("%c [Amizade Inteligente] Iniciado por Cap Caverna ", "background: #3b240b; color: #fff;");
        try {
            const responseFriends = await fetch('/game.php?screen=friends');
            const htmlFriends = await responseFriends.text();
            const parser = new DOMParser();
            const docFriends = parser.parseFromString(htmlFriends, "text/html");
            
            const amigosSet = new Set();
            docFriends.querySelectorAll('a[href*="screen=info_player"]').forEach(link => {
                const urlParams = new URLSearchParams(link.href.split('?')[1]);
                const pId = urlParams.get('id');
                if(pId) amigosSet.add(pId);
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
                    const x = parseInt(v[2]);
                    const y = parseInt(v[3]);
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

                    const matchesName = pName.includes(nomeInput);
                    const matchesK = kInput === "" || (pK !== undefined && pK == kInput);
                    const matchesAlly = allyInput === "" ? pAllyId === "0" : pAllyTag.includes(allyInput);
                    const jaAmigo = amigosSet.has(pId);
                    const eEu = pId == window.game_data.player.id;

                    return matchesName && matchesK && matchesAlly && !jaAmigo && !eEu;
                }).sort((a, b) => parseInt(a[5]) - parseInt(b[5])).slice(0, 50);

                let html = `<table width="100%" style="font-size:11px; border-collapse:collapse;">
                    <thead><tr style="background:#eee; text-align:left;"><th style="padding:5px;">Rank</th><th style="padding:5px;">Jogador</th><th style="padding:5px;">K</th><th style="padding:5px;">Tribo</th><th style="padding:5px;">Ação</th></tr></thead><tbody>`;
                
                filtrados.forEach(p => {
                    const pId = p[0];
                    const pAllyTag = allyMap[p[2]] || "---";
                    html += `<tr style="border-bottom:1px solid #ddd;">
                        <td style="padding:5px; text-align:center;">${p[5]}</td>
                        <td style="padding:5px;"><a href="/game.php?screen=info_player&id=${pId}" target="_blank" style="color:#3b240b; font-weight:bold;">${decodeURIComponent(p[1].replace(/\+/g, ' '))}</a></td>
                        <td style="padding:5px; text-align:center;">K${playerKMap[pId] || '--'}</td>
                        <td style="padding:5px; text-align:center;">${pAllyTag}</td>
                        <td style="padding:5px; text-align:center;">
                            <button onclick="adicionarAmigo('${pId}', this)" style="cursor:pointer; background:#0066cc; color:#fff; border:none; padding:4px 8px; border-radius:3px;">+ Amigo</button>
                        </td>
                    </tr>`;
                });
                listaArea.innerHTML = filtrados.length > 0 ? html + "</tbody></table>" : "<div style='padding:20px; text-align:center;'>Nenhum jogador encontrado.</div>";
            }

            document.getElementById("f_name").oninput = filtrar;
            document.getElementById("f_k").oninput = filtrar;
            document.getElementById("f_ally").oninput = filtrar;
            filtrar();

        } catch (e) {
            listaArea.innerHTML = "Erro ao carregar dados.";
        }
    }

    window.adicionarAmigo = function(id, btn) {
        const h = window.game_data.csrf;
        btn.innerText = "...";
        btn.disabled = true;
        fetch(`/game.php?screen=friends&action=add_friend&id=${id}&h=${h}`)
            .then(() => {
                btn.innerText = "Enviado";
                btn.style.background = "#888";
            });
    };

    iniciar();
})();
