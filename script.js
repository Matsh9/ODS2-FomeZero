let unlockedEndings =
    JSON.parse(localStorage.getItem("district2_endings")) || [];

let year = 1;
let usedEvents = [];

let stats = {
    food: 70,
    money: 60,
    env: 70,
    people: 60
};

let history = [];

const events = [
    {
        title: "☀️ Seca Histórica",
        text: "As chuvas diminuíram. Famílias já começaram a estocar comida.",
        choices: [
            { text: "Importar alimentos", effect: { food: 25, money: -20, env: -5, people: 10 }, feedback: "Você salvou famílias agora, mas a cidade gastou muito." },
            { text: "Racionar comida", effect: { food: -10, money: 8, env: 5, people: -22 }, feedback: "As filas cresceram. Muita gente sentiu que foi abandonada." },
            { text: "Investir em irrigação sustentável", effect: { food: 12, money: -15, env: 15, people: 6 }, feedback: "Foi caro, mas a comunidade viu esperança no futuro." }
        ]
    },
    {
        title: "🍔 Desperdício nos mercados",
        text: "Toneladas de alimentos bons estão sendo jogadas fora.",
        choices: [
            { text: "Criar banco de alimentos", effect: { food: 22, money: -10, env: 10, people: 18 }, feedback: "Famílias receberam alimentos que iriam para o lixo." },
            { text: "Multar mercados", effect: { food: 10, money: 12, env: 6, people: -8 }, feedback: "Funcionou, mas comerciantes reclamaram da sua decisão." },
            { text: "Ignorar", effect: { food: -18, money: 4, env: -12, people: -15 }, feedback: "O desperdício continuou enquanto pessoas passavam fome." }
        ]
    },
    {
        title: "🦗 Praga na plantação",
        text: "Uma praga ameaça destruir a próxima colheita.",
        choices: [
            { text: "Usar agrotóxicos fortes", effect: { food: 24, money: -8, env: -28, people: -5 }, feedback: "A colheita foi salva, mas rios e solos foram contaminados." },
            { text: "Controle biológico", effect: { food: 12, money: -15, env: 18, people: 8 }, feedback: "Foi mais sustentável e gerou confiança na população." },
            { text: "Esperar passar", effect: { food: -28, money: 5, env: 5, people: -18 }, feedback: "A praga avançou. A fome começou a aparecer nos bairros pobres." }
        ]
    },
    {
        title: "👶 População aumentou",
        text: "Novas famílias chegaram procurando alimento e trabalho.",
        choices: [
            { text: "Acolher e ampliar produção", effect: { food: -12, money: -14, env: -6, people: 18 }, feedback: "A cidade ficou mais cheia, mas mostrou humanidade." },
            { text: "Priorizar famílias vulneráveis", effect: { food: 6, money: -7, env: 0, people: 12 }, feedback: "A distribuição ficou mais justa." },
            { text: "Fechar as portas", effect: { food: 8, money: 8, env: 5, people: -28 }, feedback: "Os recursos foram preservados, mas a desigualdade aumentou." }
        ]
    },
    {
        title: "🌱 Agricultura familiar",
        text: "Pequenos agricultores pedem apoio para produzir comida local.",
        choices: [
            { text: "Financiar pequenos agricultores", effect: { food: 18, money: -15, env: 16, people: 18 }, feedback: "A comunidade ficou mais independente e sustentável." },
            { text: "Apoiar grandes produtores", effect: { food: 24, money: 12, env: -22, people: -12 }, feedback: "A produção cresceu, mas poucos lucraram." },
            { text: "Não investir", effect: { food: -12, money: 10, env: 0, people: -10 }, feedback: "A cidade economizou, mas perdeu uma chance importante." }
        ]
    },
    {
        title: "📱 Trend do desperdício",
        text: "Jovens viralizaram vídeos jogando comida fora.",
        choices: [
            { text: "Campanha com influenciadores", effect: { food: 12, money: -6, env: 10, people: 14 }, feedback: "A mensagem chegou nos jovens sem parecer sermão." },
            { text: "Punir quem participar", effect: { food: 8, money: 8, env: 5, people: -18 }, feedback: "A trend caiu, mas você virou meme autoritário." },
            { text: "Fingir que não viu", effect: { food: -16, money: 0, env: -10, people: -8 }, feedback: "A brincadeira virou hábito e o desperdício aumentou." }
        ]
    },
    {
        title: "🤖 Tecnologia agrícola",
        text: "Sensores podem economizar água nas plantações.",
        choices: [
            { text: "Comprar para toda cidade", effect: { food: 14, money: -22, env: 22, people: 8 }, feedback: "Caro, mas o futuro agradeceu." },
            { text: "Testar em poucas fazendas", effect: { food: 8, money: -8, env: 12, people: 7 }, feedback: "Foi uma escolha segura e inteligente." },
            { text: "Recusar tecnologia", effect: { food: -2, money: 10, env: -6, people: -5 }, feedback: "Você economizou agora, mas perdeu eficiência." }
        ]
    },
    {
        title: "💸 Crise econômica",
        text: "O orçamento caiu e programas sociais estão ameaçados.",
        choices: [
            { text: "Manter alimentação popular", effect: { food: 18, money: -22, env: 0, people: 18 }, feedback: "Você protegeu os mais pobres, mas a conta veio alta." },
            { text: "Cortar programas sociais", effect: { food: -28, money: 24, env: 0, people: -28 }, feedback: "A economia respirou. A população, não." },
            { text: "Buscar ONGs e parcerias", effect: { food: 12, money: -6, env: 6, people: 12 }, feedback: "A cidade encontrou apoio sem carregar tudo sozinha." }
        ]
    },
    {
        title: "🏫 Merenda escolar em risco",
        text: "Escolas avisam que crianças estão indo estudar com fome.",
        choices: [
            { text: "Priorizar merenda escolar", effect: { food: 16, money: -12, env: 0, people: 20 }, feedback: "Crianças voltaram a estudar melhor. A cidade se emocionou." },
            { text: "Reduzir porções", effect: { food: -8, money: 8, env: 0, people: -18 }, feedback: "A economia veio às custas de crianças com fome." },
            { text: "Criar hortas nas escolas", effect: { food: 10, money: -8, env: 14, people: 14 }, feedback: "Os alunos aprenderam sustentabilidade na prática." }
        ]
    },
    {
        title: "🌳 Proposta de desmatamento",
        text: "Empresários querem derrubar mata para plantar em larga escala.",
        choices: [
            { text: "Autorizar desmatamento", effect: { food: 28, money: 18, env: -35, people: -8 }, feedback: "A comida aumentou rápido, mas o futuro ficou mais seco." },
            { text: "Proibir totalmente", effect: { food: -8, money: -8, env: 20, people: 6 }, feedback: "Você protegeu a natureza, mas a produção sentiu o impacto." },
            { text: "Permitir só com reflorestamento", effect: { food: 12, money: 5, env: 8, people: 10 }, feedback: "Não agradou todo mundo, mas foi uma solução equilibrada." }
        ]
    },
    {
        title: "🚚 Doação de alimentos",
        text: "Uma ONG oferece alimentos, mas exige organização na distribuição.",
        choices: [
            { text: "Aceitar e distribuir justamente", effect: { food: 22, money: -4, env: 0, people: 18 }, feedback: "A ajuda chegou para quem realmente precisava." },
            { text: "Vender parte da doação", effect: { food: 8, money: 18, env: 0, people: -20 }, feedback: "O caixa melhorou, mas a população descobriu e se revoltou." },
            { text: "Recusar por orgulho político", effect: { food: -18, money: 0, env: 0, people: -15 }, feedback: "A cidade perdeu ajuda por vaidade." }
        ]
    },
    {
        title: "🥬 Feira popular",
        text: "Moradores querem uma feira com alimentos baratos aos domingos.",
        choices: [
            { text: "Apoiar a feira", effect: { food: 14, money: -8, env: 8, people: 18 }, feedback: "A comida ficou mais acessível e produtores locais venderam mais." },
            { text: "Cobrar taxas altas", effect: { food: 2, money: 15, env: 0, people: -12 }, feedback: "A feira aconteceu, mas ficou cara para quem precisava." },
            { text: "Não autorizar", effect: { food: -8, money: 2, env: 0, people: -15 }, feedback: "Você perdeu uma chance simples de aproximar comida e população." }
        ]
    },
    {
        title: "🧑‍🌾 Jovens abandonam o campo",
        text: "Muitos jovens não querem trabalhar na agricultura.",
        choices: [
            { text: "Criar curso de tecnologia agrícola", effect: { food: 12, money: -12, env: 10, people: 12 }, feedback: "A agricultura ficou mais moderna e atrativa." },
            { text: "Aumentar salários rurais", effect: { food: 15, money: -18, env: 0, people: 10 }, feedback: "Mais jovens ficaram, mas o orçamento apertou." },
            { text: "Ignorar", effect: { food: -18, money: 4, env: 0, people: -10 }, feedback: "Com menos trabalhadores, a produção caiu." }
        ]
    },
    {
        title: "🏥 Fome e saúde",
        text: "Postos de saúde relatam aumento de fraqueza e desnutrição na população.",
        choices: [
            { text: "Criar cestas emergenciais", effect: { food: 18, money: -16, env: 0, people: 18 }, feedback: "A ajuda foi imediata e salvou famílias." },
            { text: "Investir em educação alimentar", effect: { food: 8, money: -6, env: 8, people: 8 }, feedback: "Não resolveu tudo, mas ajudou a longo prazo." },
            { text: "Aguardar próximo relatório", effect: { food: -20, money: 5, env: 0, people: -20 }, feedback: "Enquanto você esperou, a situação piorou." }
        ]
    },
    {
        title: "🔥 Queimada ilegal",
        text: "Produtores queimaram área verde para abrir espaço de plantio.",
        choices: [
            { text: "Punir e recuperar área", effect: { food: -5, money: -10, env: 22, people: 10 }, feedback: "A produção caiu um pouco, mas a cidade defendeu o meio ambiente." },
            { text: "Fazer vista grossa", effect: { food: 20, money: 10, env: -30, people: -12 }, feedback: "A colheita aumentou, mas o ar ficou pesado e o solo sofreu." },
            { text: "Negociar recuperação parcial", effect: { food: 8, money: 0, env: 8, people: 5 }, feedback: "Foi uma solução mediana, mas evitou conflito maior." }
        ]
    }
];

let characters = {
    ana: 0,
    maria: 0,
    lucas: 0,
    carlos: 0
};

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const selectedScreen = document.getElementById(id);

    if (!selectedScreen) {
        console.error(`Tela com id "${id}" não encontrada no HTML.`);
        return;
    }

    selectedScreen.classList.add("active");
}

function startGame() {
    year = 1;
    usedEvents = [];
    history = [];
    characters = {
        ana: 0,
        maria: 0,
        lucas: 0,
        carlos: 0
    };

    stats = {
        food: 70,
        money: 60,
        env: 70,
        people: 60
    };

    showScreen("game");
    updateBars();
    updateHistory();
    loadEvent();
}

function updateBars() {
    document.getElementById("year").textContent = year;

    updateBar("food", stats.food);
    updateBar("money", stats.money);
    updateBar("env", stats.env);
    updateBar("people", stats.people);
}

function updateBar(name, value) {
    value = Math.max(0, Math.min(100, value));

    document.getElementById(name + "Bar").style.width = value + "%";
    document.getElementById(name + "Text").textContent = value + "%";

    const bar = document.getElementById(name + "Bar");

    if (value <= 25) {
        bar.style.background = "linear-gradient(90deg, #ff3333, #ff8800)";
    } else if (value <= 50) {
        bar.style.background = "linear-gradient(90deg, #ffcc29, #ff8800)";
    } else {
        bar.style.background = "linear-gradient(90deg, #7ed957, #ffcc29)";
    }
}

function loadEvent() {
    document.getElementById("feedback").textContent = "";

    const newsFeed = document.getElementById("newsFeed");
    const commentsList = document.getElementById("commentsList");
    const characterEvent = document.getElementById("characterEvent");

    if (newsFeed) {
        newsFeed.style.display = "none";
    }

    if (commentsList) {
        commentsList.innerHTML = "";
    }

    if (characterEvent) {
        characterEvent.style.display = "none";
    }

    if (usedEvents.length === events.length) {
        usedEvents = [];
    }

    let index;

    do {
        index = Math.floor(Math.random() * events.length);
    } while (usedEvents.includes(index));

    usedEvents.push(index);

    const event = events[index];

    document.getElementById("cardTitle").textContent = event.title;
    document.getElementById("cardText").textContent = event.text;

    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";

    event.choices.forEach(choice => {
        const button = document.createElement("button");
        button.textContent = choice.text;
        button.onclick = () => makeChoice(choice, event.title);
        choicesDiv.appendChild(button);
    });
}

function makeChoice(choice, eventTitle) {
    document.getElementById("feedback").textContent = choice.feedback;

    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = "";

    const newsFeed = document.getElementById("newsFeed");
    const newsText = document.getElementById("newsText");
    const commentsList = document.getElementById("commentsList");

    if (newsFeed && newsText && commentsList) {
        newsFeed.style.display = "block";

        newsText.textContent = choice.news || gerarNoticia(eventTitle, choice.text);

        commentsList.innerHTML = "";

        const comments = choice.comments || gerarComentarios(choice.effect);

        comments.forEach(comment => {
            const li = document.createElement("li");
            li.textContent = comment;
            commentsList.appendChild(li);
        });
    }
    atualizarPersonagens(eventTitle, choice);
    mostrarHistoriaPersonagem(eventTitle, choice);

    history.unshift(`${eventTitle}: ${choice.text}`);

    if (history.length > 4) {
        history.pop();
    }

    updateHistory();

    const card = document.querySelector(".card");
    card.classList.add("danger");
    setTimeout(() => card.classList.remove("danger"), 500);

    const continueBtn = document.getElementById("continueBtn");
    continueBtn.style.display = "block";

    continueBtn.onclick = () => {
        stats.food += choice.effect.food;
        stats.money += choice.effect.money;
        stats.env += choice.effect.env;
        stats.people += choice.effect.people;

        limitStats();
        updateBars();

        continueBtn.style.display = "none";

        if (checkGameOver()) {
            showFinal();
            return;
        }

        year++;

        if (year > 10) {
            showFinal();
        } else {
            loadEvent();
        }
    };
}
function atualizarPersonagens(eventTitle, choice) {
    if (eventTitle.includes("Merenda") || eventTitle.includes("escolar")) {
        characters.ana += choice.effect.food > 0 ? 2 : -2;
        characters.ana += choice.effect.people > 0 ? 1 : -1;
    }

    if (eventTitle.includes("Desperdício") || eventTitle.includes("Doação") || eventTitle.includes("Fome")) {
        characters.maria += choice.effect.food > 0 ? 2 : -2;
        characters.maria += choice.effect.people > 0 ? 1 : -1;
    }

    if (eventTitle.includes("Agricultura") || eventTitle.includes("Jovens") || eventTitle.includes("Praga") || eventTitle.includes("Queimada")) {
        characters.lucas += choice.effect.env > 0 ? 2 : -2;
        characters.lucas += choice.effect.food > 0 ? 1 : -1;
    }

    if (eventTitle.includes("Feira") || eventTitle.includes("mercados") || eventTitle.includes("econômica")) {
        characters.carlos += choice.effect.money > 0 ? 2 : -1;
        characters.carlos += choice.effect.food > 0 ? 1 : -1;
    }
}

function gerarDestinoPersonagem(nome, valor, bom, medio, ruim) {
    if (valor >= 3) {
        return `<p><strong>${nome}</strong><br>${bom}</p>`;
    }

    if (valor <= -3) {
        return `<p><strong>${nome}</strong><br>${ruim}</p>`;
    }

    return `<p><strong>${nome}</strong><br>${medio}</p>`;
}

function gerarDestinoFinalPersonagens() {
    return `
        <h3>O destino das pessoas da cidade</h3>

        ${gerarDestinoPersonagem(
        "👧 Ana",
        characters.ana,
        "Conseguiu estudar melhor porque teve acesso à alimentação adequada na escola.",
        "Continuou estudando, mas ainda enfrentou períodos de insegurança alimentar.",
        "Teve dificuldades na escola por causa da fome e da redução da merenda."
    )}

        ${gerarDestinoPersonagem(
        "👵 Dona Maria",
        characters.maria,
        "Recebeu apoio alimentar e conseguiu viver com mais dignidade.",
        "Sobreviveu com ajuda da comunidade, mas ainda enfrentou dificuldades.",
        "Passou por insegurança alimentar e dependeu de vizinhos para conseguir comida."
    )}

        ${gerarDestinoPersonagem(
        "👨‍🌾 Lucas",
        characters.lucas,
        "Viu futuro na agricultura sustentável e continuou trabalhando no campo.",
        "Continuou no campo, mas com dúvidas sobre o futuro da produção.",
        "Abandonou o campo por falta de apoio e pelas dificuldades ambientais."
    )}

        ${gerarDestinoPersonagem(
        "🏪 Carlos",
        characters.carlos,
        "Manteve seu mercado aberto e ajudou a abastecer a comunidade.",
        "Conseguiu manter o comércio, mas sofreu com a instabilidade da cidade.",
        "Teve dificuldades para manter o mercado por causa da crise e da má distribuição."
    )}
    `;
}

function mostrarHistoriaPersonagem(eventTitle, choice) {
    const characterEvent = document.getElementById("characterEvent");
    const characterName = document.getElementById("characterName");
    const characterText = document.getElementById("characterText");

    if (!characterEvent || !characterName || !characterText) {
        return;
    }

    characterEvent.style.display = "block";

    if (eventTitle.includes("Merenda")) {
        characterName.textContent = "👧 Ana";
        characterText.textContent =
            choice.effect.food > 0 && choice.effect.people > 0
                ? "Hoje consegui prestar atenção na aula porque não estava com fome."
                : "Fica difícil aprender quando a barriga está vazia.";

    } else if (eventTitle.includes("Desperdício") || eventTitle.includes("Doação") || eventTitle.includes("Fome")) {
        characterName.textContent = "👵 Dona Maria";
        characterText.textContent =
            choice.effect.food > 0
                ? "Não gosto de depender dos outros, mas essa ajuda salvou minha semana."
                : "Às vezes eu só queria ter certeza de que amanhã vai ter comida.";

    } else if (eventTitle.includes("Agricultura") || eventTitle.includes("Jovens") || eventTitle.includes("Praga") || eventTitle.includes("Queimada")) {
        characterName.textContent = "👨‍🌾 Lucas";
        characterText.textContent =
            choice.effect.env > 0 || choice.effect.food > 10
                ? "Ainda dá para acreditar no campo quando alguém investe no futuro."
                : "Eu queria continuar produzindo comida, mas parece que ninguém olha para quem vive da terra.";

    } else if (eventTitle.includes("Feira") || eventTitle.includes("mercados") || eventTitle.includes("econômica")) {
        characterName.textContent = "🏪 Carlos";
        characterText.textContent =
            choice.effect.money > 0 || choice.effect.food > 0
                ? "Quando a cidade se organiza, até o pequeno comerciante consegue ajudar."
                : "Se a crise continuar assim, não sei por quanto tempo meu mercado fica aberto.";

    } else {
        const falas = [
            {
                nome: "👵 Dona Maria",
                texto: "A gente sente no prato cada decisão tomada lá em cima."
            },
            {
                nome: "👧 Ana",
                texto: "Eu só queria que nenhuma criança precisasse estudar com fome."
            },
            {
                nome: "👨‍🌾 Lucas",
                texto: "Produzir comida também depende de água, solo e apoio."
            },
            {
                nome: "🏪 Carlos",
                texto: "Quando falta comida, todo mundo sente: quem compra, quem vende e quem planta."
            }
        ];

        const fala = falas[Math.floor(Math.random() * falas.length)];

        characterName.textContent = fala.nome;
        characterText.textContent = fala.texto;
    }
}

function gerarNoticia(eventTitle, choiceText) {
    return `${eventTitle}: governo decide "${choiceText}" e divide opiniões no Distrito 2.`;
}

function gerarComentarios(effect) {
    const comments = [];

    if (effect.food > 10) {
        comments.push("❤️ 'Pelo menos agora mais famílias vão ter comida na mesa.'");
    }

    if (effect.food < 0) {
        comments.push("😡 'Como vamos viver se a comida está diminuindo?'");
    }

    if (effect.money < -10) {
        comments.push("💸 'A ideia é boa, mas quem vai pagar essa conta?'");
    }

    if (effect.money > 10) {
        comments.push("💰 'Finalmente alguém pensou na economia da cidade.'");
    }

    if (effect.env < -10) {
        comments.push("🌵 'Estão destruindo a natureza em troca de resultado rápido.'");
    }

    if (effect.env > 10) {
        comments.push("🌱 'Essa decisão protege o futuro da nossa comunidade.'");
    }

    if (effect.people < -10) {
        comments.push("😡 'A população não foi ouvida nessa decisão.'");
    }

    if (effect.people > 10) {
        comments.push("😊 'Dessa vez senti que pensaram nas pessoas.'");
    }

    if (comments.length === 0) {
        comments.push("😐 'Ainda é cedo para saber se isso foi bom ou ruim.'");
        comments.push("💬 'A cidade está dividida sobre essa decisão.'");
    }

    return comments.slice(0, 3);
}

function updateHistory() {
    const list = document.getElementById("historyList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    history.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });
}

function limitStats() {
    stats.food = Math.max(0, Math.min(100, stats.food));
    stats.money = Math.max(0, Math.min(100, stats.money));
    stats.env = Math.max(0, Math.min(100, stats.env));
    stats.people = Math.max(0, Math.min(100, stats.people));
}

function checkGameOver() {
    return stats.food <= 0 || stats.money <= 0 || stats.env <= 0 || stats.people <= 0;
}
function unlockEnding(name) {
    if (!unlockedEndings.includes(name)) {
        unlockedEndings.push(name);
        localStorage.setItem("district2_endings", JSON.stringify(unlockedEndings));
    }
}

function calculateScore() {
    return Math.round(
        stats.food * 2 +
        stats.money * 1.5 +
        stats.env * 2 +
        stats.people * 2
    );
}

function showFinal() {
    showScreen("final");

    let title = "";
    let text = "";
    let future = "";

    const average = Math.round((stats.food + stats.money + stats.env + stats.people) / 4);

    if (stats.food <= 0) {
        title = "☠️ Colapso Alimentar";
        text = "A cidade ficou sem comida. Mercados esvaziaram, famílias entraram em desespero e a fome venceu.";
        future = "Em 5 anos, esse modelo causaria fome extrema, aumento da desigualdade e dependência de ajuda externa.";
    } else if (stats.money <= 0) {
        title = "💸 Falência da Cidade";
        text = "Você tentou resolver tudo, mas o orçamento acabou. Sem dinheiro, os programas sociais pararam.";
        future = "Boas intenções precisam de planejamento. Sem economia equilibrada, políticas públicas deixam de funcionar.";
    } else if (stats.env <= 0) {
        title = "🔥 Colapso Ambiental";
        text = "A cidade produziu muito no começo, mas destruiu solo, água e florestas. O futuro secou.";
        future = "Em 5 anos, a produção cairia drasticamente, mostrando que combater a fome também depende da natureza.";
    } else if (stats.people <= 0) {
        title = "⚠️ Revolta Popular";
        text = "A população perdeu a confiança. Protestos tomaram as ruas e sua liderança caiu.";
        future = "A fome também é um problema social. Quando a distribuição é injusta, a revolta cresce.";
    } else if (stats.food >= 80 && stats.env >= 70 && stats.people >= 70 && stats.money >= 45) {
        title = "🏆 Guardião da Colheita";
        text = "Você alimentou a população, protegeu o meio ambiente e manteve a cidade de pé.";
        future = "Se todos seguissem esse caminho por 5 anos, haveria menos fome, menos desperdício e mais sustentabilidade.";
    } else if (stats.money >= 80 && stats.food < 60) {
        title = "🏙️ Cidade Rica, Povo com Fome";
        text = "A economia cresceu, mas a comida não chegou para quem precisava.";
        future = "Esse final mostra que crescimento econômico sem distribuição justa não acaba com a fome.";
    } else if (stats.food >= 85 && stats.env < 45) {
        title = "🌵 O Preço da Produção";
        text = "Você produziu muita comida, mas sacrificou a natureza no processo.";
        future = "Em poucos anos, o solo perderia força, a água ficaria escassa e a fome voltaria ainda pior.";
    } else if (stats.people >= 85 && stats.money < 40) {
        title = "❤️ Líder Popular Endividado";
        text = "O povo te ama, mas a cidade ficou financeiramente frágil.";
        future = "Ajudar a população é essencial, mas políticas públicas precisam continuar possíveis no futuro.";
    } else if (average >= 70) {
        title = "🌾 Futuro Sustentável";
        text = "Você não foi perfeito, mas conseguiu equilíbrio entre comida, economia, população e meio ambiente.";
        future = "Esse é o caminho mais realista: decisões equilibradas, menos desperdício e cuidado com os mais vulneráveis.";
    } else {
        title = "🌫️ Sobrevivência Difícil";
        text = "A cidade chegou ao fim dos 10 anos, mas com muitos problemas acumulados.";
        future = "O resultado mostra que pequenas decisões ruins, repetidas por anos, podem manter a fome e a desigualdade.";
    }

    if (!checkGameOver()) {
        unlockEnding(title);
    }

    const score = calculateScore();
    document.getElementById("finalTitle").textContent = title;
    document.getElementById("finalText").textContent = text;
    document.getElementById("futureText").textContent = future;
    document.getElementById("charactersFinal").innerHTML = gerarDestinoFinalPersonagens();
    document.getElementById("scoreText").textContent = `Pontuação final: ${score} pontos`;
    document.getElementById("endingProgress").textContent =
        `Finais descobertos: ${unlockedEndings.length}/8`;
}

function restartGame() {
    showScreen("home");
}