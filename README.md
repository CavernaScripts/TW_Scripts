# ⚔️ CavernaScripts - Suíte de Automação para Tribal Wars

Bem-vindo ao repositório oficial do **SeaCluster**. Aqui estão organizados os scripts desenvolvidos para otimizar a performance estratégica e a automação de processos no Tribal Wars.

---

## 📂 Manual de Uso dos Scripts

| Script | Onde Executar | Funcionalidade Principal |
| :--- | :--- | :--- |
| **Muralha BB** | Assistente de Saque (AM) | Envio automático de Bárbaros + Arietes para demolição de muralhas em aldeias bárbaras. |
| **Agendador de Ataques** | Confirmação de Ataque | Programa o envio exato das tropas (ms) para bater o delay do servidor. |
| **Adicionar Amigos** | Rankings / Classificações | Adiciona automaticamente todos os jogadores da lista atual como amigos. |
| **CapNickCoord** | Mapa / Perfil de Jogador | Extrai uma lista limpa com o Nick e todas as Coordenadas do alvo. |
| **Classificação Player K** | Rankings por Continente | Filtra jogadores por ODA/Pontuação dentro de um K específico. |
| **All in One (Tampermonkey)** | Global (Automático) | Suíte completa que unifica farm, coleta e alertas em um único painel. |

---

## 🛠️ Detalhes Técnicos

### 🧱 Muralha BB
O script injeta um botão **M** na tabela de saques. Ao clicar, ele abre uma janela auxiliar que preenche os campos e confirma o ataque de forma independente, garantindo que o alvo seja selecionado corretamente.
> *Configurável via interface no topo da tabela.*

### 🕒 Agendador de Ataques
Ideal para coordenar OPs. Ao ser executado na tela de confirmação, ele permite definir o horário de chegada. O script realiza o clique de confirmação no milissegundo exato.

### 📊 Classificação Player K
Essencial para análise de mapa. Permite identificar rapidamente quais jogadores no seu continente possuem alto ODA (ameaças) ou apenas pontos (alvos fáceis).

---

## 🚀 Como Instalar
1. Certifique-se de ter a extensão **Tampermonkey** instalada (para scripts `.user.js`).
2. Para scripts `.js` simples, crie um novo favorito no seu navegador e cole o código no campo "URL".
3. Execute o script na página correspondente conforme indicado no manual acima.

---

<p align="right">
  <i>by Cap Caverna</i> 🛡️
</p>
