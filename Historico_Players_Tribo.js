javascript:(function() {
    'use strict';

    const world = game_data.world;
    const tribeId = new URLSearchParams(window.location.search).get('id');

    if (!tribeId) {
        UI.ErrorMessage('Por favor, execute o script no Perfil de uma Tribo.', 3000);
        return;
    }

    const domain = window.location.hostname.split('.')[0].replace(/[0-9]/g, '');
    const twStatsUrl = `https://${domain}.twstats.com/${world}/index.php?page=tribe&mode=tribe_changes&id=${tribeId}`;

    // Remove janela anterior se existir
    if (document.getElementById('twstats-frame-container')) {
        document.getElementById('twstats-frame-container').remove();
    }

    // Estrutura da Janela alinhada à direita
    const container = document.createElement('div');
    container.id = 'twstats-frame-container';
    container.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        width: 450px;
        height: 550px;
        z-index: 10000;
        background: #f4e4bc;
        border: 2px solid #3b2412;
        box-shadow: -5px 5px 15px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
        border-radius: 4px;
        font-family: Verdana, Arial, sans-serif;
    `;

    // Cabeçalho e Rodapé com Assinatura
    container.innerHTML = `
        <div style="background:#3b2412; color:#f4e4bc; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; font-size:12px;">
            <span>HISTÓRICO DE PLAYERS</span>
            <span id="close-tw-frame" style="cursor:pointer; font-size:14px;">[X]</span>
        </div>
        <iframe src="${twStatsUrl}" style="flex:1; border:none; background:white;"></iframe>
        <div style="background:#3b2412; color:#f4e4bc; padding:4px 10px; text-align:right; font-size:10px; font-style:italic; border-top:1px solid #3b2412;">
            Pobre Premium Plus (.PPP.)
        </div>
    `;

    document.body.appendChild(container);

    // Função para fechar
    document.getElementById('close-tw-frame').onclick = function() {
        container.remove();
    };
    
    UI.SuccessMessage('Histórico carregado com sucesso.', 2000);
})();
