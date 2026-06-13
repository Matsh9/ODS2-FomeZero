let year = 1;

let stats = {
  food: 70,
  money: 60,
  env: 70,
  people: 60
};

let decisions = [];

const events = [
  {
    title: "☀️ Seca Histórica",
    text: "As chuvas diminuíram e a produção de alimentos caiu. A população está preocupada.",
    choices: [
      {
        text: "Importar alimentos rapidamente",
        effect: { food: 25, money: -20, env: -5, people: 10 },
        feedback: "A fome diminuiu, mas a cidade gastou muito dinheiro."
      },
      {
        text: "Racionar alimentos",
        effect: { food: -5, money: 5, env: 5, people: -20 },
        feedback: "Você economizou recursos, mas a população ficou insatisfeita."
      },
      {
        text: "Investir em irrigação sustentável",
        effect: { food: 10, money: -15, env: 15, people: 5 },
        feedback: "A solução foi mais lenta, mas fortaleceu o futuro da comunidade."
      }
    ]
  },
  {
    title: "🍔 Desperdício nos mercados",
    text: "Mercados estão jogando fora alimentos que ainda poderiam ser consumidos.",
    choices: [
      {
        text: "Criar programa de redistribuição",
        effect: { food: 20, money: -10, env: 10, people: 15 },
        feedback: "Muitas famílias receberam alimentos que seriam desperdiçados."
      },
      {
        text: "Ignorar, pois o governo tem outros problemas",
        effect: { food: -15, money: 5, env: -10, people: -15 },
        feedback: "O desperdício continuou e a fome aumentou."
      },
      {
        text: "Fazer campanha educativa nas escolas",
        effect: { food: 8, money: -5, env: 12, people: 8 },
        feedback: "A mudança foi pequena no começo, mas melhorou a consciência da população."
      }
    ]
  },
  {
    title: "🦗 Praga na plantação",
    text: "Uma praga atingiu parte das plantações e ameaça a próxima colheita.",
    choices: [
      {
        text: "Usar agrotóxicos fortes",
        effect: { food: 20, money: -10, env: -25, people: -5 },
        feedback: "A produção foi salva, mas o meio ambiente sofreu bastante."
      },
      {
        text: "Usar controle biológico",
        effect: { food: 10, money: -15, env: 15, people: 5 },
        feedback: "A solução foi sustentável, mas exigiu investimento."
      },
      {
        text: "Não agir agora",
        effect: { food: -25, money: 5, env: 5, people: -15 },
        feedback: "A praga se espalhou e prejudicou a segurança alimentar."
      }
    ]
  },
  {
    title: "👶 Aumento da população",
    text: "Novas famílias chegaram à cidade em busca de comida e trabalho.",
    choices: [
      {
        text: "Acolher as famílias e ampliar a produção",
        effect: { food: -10, money: -15, env: -5, people: 15 },
        feedback: "A cidade acolheu quem precisava, mas a pressão sobre os recursos aumentou."
      },
      {
        text: "Criar cadastro para priorizar os mais vulneráveis",
        effect: { food: 5, money: -5, env: 0, people: 10 },
        feedback: "A distribuição ficou mais justa e organizada."
      },
      {
        text: "Fechar a entrada da cidade",
        effect: { food: 5, money: 5, env: 5, people: -25 },
        feedback: "A cidade preservou recursos, mas aumentou a desigualdade."
      }
    ]
  },
  {
    title: "🌱 Agricultura familiar",
    text: "Pequenos agricultores pedem apoio para produzir alimentos locais.",
    choices: [
      {
        text: "Financiar agricultura familiar",
        effect: { food: 15, money: -15, env: 15, people: 15 },
        feedback: "A produção local cresceu e a comunidade ficou mais forte."
      },
      {
        text: "Apoiar apenas grandes produtores",
        effect: { food: 20, money: 10, env: -20, people: -10 },
        feedback: "A produção aumentou, mas a desigualdade também."
      },
      {
        text: "Não investir",
        effect: { food: -10, money: 10, env: 0, people: -10 },
        feedback: "A cidade economizou, mas perdeu uma chance de fortalecer a produção local."
      }
    ]
  },
  {
    title: "📱 Influenciador incentiva desperdício",
    text: "Uma trend viral incentiva jogar comida fora em vídeos.",
    choices: [
      {
        text: "Criar campanha nas redes com jovens",
        effect: { food: 10, money: -5, env: 10, people: 12 },
        feedback: "A linguagem jovem ajudou a combater o desperdício."
      },
      {
        text: "Multar quem desperdiçar em público",
        effect: { food: 5, money: 10, env: 5, people: -15 },
        feedback: "As multas reduziram parte do problema, mas geraram revolta."
      },
      {
        text: "Ignorar a trend",
        effect: { food: -15, money: 0, env: -10, people: -5 },
        feedback: "A trend cresceu e piorou o desperdício."
      }
    ]
  },
  {
    title: "🤖 Tecnologia sustentável",
    text: "Uma startup oferece sensores para economizar água nas plantações.",
    choices: [
      {
        text: "Comprar a tecnologia",
        effect: { food: 10, money: -20, env: 20, people: 5 },
        feedback: "O investimento foi caro, mas melhorou a produção sustentável."
      },
      {
        text: "Testar em poucas fazendas",
        effect: { food: 5, money: -8, env: 10, people: 5 },
        feedback: "O teste foi seguro e mostrou bons resultados."
      },
      {
        text: "Recusar a proposta",
        effect: { food: 0, money: 10, env: -5, people: -5 },
        feedback: "A cidade economizou, mas perdeu uma oportunidade de inovação."
      }
    ]
  },
  {
    title: "💸 Crise econômica",
    text: "A arrecadação caiu e o orçamento para programas sociais foi reduzido.",
    choices: [
      {
        text: "Manter programas de alimentação",
        effect: { food: 15, money: -20, env: 0, people: 15 },
        feedback: "A população foi protegida, mas a economia ficou pressionada."
      },
      {
        text: "Cortar programas sociais",
        effect: { food: -25, money: 20, env: 0, people: -25 },
        feedback: "A economia respirou, mas a fome cresceu muito."
      },
      {
        text: "Buscar parcerias com ONGs",
        effect: { food: 10, money: -5, env: 5, people: 10 },
        feedback: "As parcerias ajudaram sem destruir o orçamento."
      }
    ]
  }
];

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
}

function startGame() {
  year = 1;
  stats = {
    food: 70,
    money: 60,
    env: 70,
    people: 60
  };
  decisions = [];

  showScreen("game");
  updateBars();
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
}

function loadEvent() {
  document.getElementById("feedback").textContent = "";

  const event = events[Math.floor(Math.random() * events.length)];

  document.getElementById("cardTitle").textContent = event.title;
  document.getElementById("cardText").textContent = event.text;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  event.choices.forEach(choice => {
    const button = document.createElement("button");
    button.textContent = choice.text;
    button.onclick = () => makeChoice(choice);
    choicesDiv.appendChild(button);
  });
}

function makeChoice(choice) {
  stats.food += choice.effect.food;
  stats.money += choice.effect.money;
  stats.env += choice.effect.env;
  stats.people += choice.effect.people;

  limitStats();

  decisions.push(choice);

  document.getElementById("feedback").textContent = choice.feedback;

  updateBars();

  if (checkGameOver()) {
    setTimeout(showFinal, 1200);
    return;
  }

  year++;

  if (year > 5) {
    setTimeout(showFinal, 1200);
  } else {
    setTimeout(loadEvent, 1600);
  }
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

function showFinal() {
  showScreen("final");

  let title = "";
  let text = "";
  let future = "";

  if (stats.food <= 0) {
    title = "☠️ Colapso Alimentar";
    text = "A cidade ficou sem comida. A fome se espalhou e a população entrou em desespero.";
    future = "Se esse modelo fosse repetido por 5 anos, a desigualdade aumentaria e milhares de pessoas ficariam sem acesso a alimentos básicos.";
  } else if (stats.money <= 0) {
    title = "💸 Falência da Cidade";
    text = "A cidade não conseguiu manter seus programas e entrou em crise econômica.";
    future = "Mesmo com boas intenções, políticas sem planejamento financeiro não se sustentariam no longo prazo.";
  } else if (stats.env <= 0) {
    title = "🔥 Colapso Ambiental";
    text = "A produção cresceu no começo, mas destruiu os recursos naturais.";
    future = "Em 5 anos, o solo ficaria degradado, a água acabaria e a produção de alimentos cairia drasticamente.";
  } else if (stats.people <= 0) {
    title = "⚠️ Revolta Popular";
    text = "A população perdeu a confiança na liderança e protestos tomaram a cidade.";
    future = "A fome não é apenas falta de comida. Ela também gera instabilidade social, revolta e desigualdade.";
  } else if (stats.food >= 75 && stats.env >= 65 && stats.people >= 65) {
    title = "🏆 Guardião da Colheita";
    text = "Você conseguiu alimentar a população sem destruir o meio ambiente.";
    future = "Se decisões parecidas fossem aplicadas por 5 anos, a comunidade teria mais segurança alimentar, menos desperdício e produção sustentável.";
  } else if (stats.money >= 75 && stats.food < 60) {
    title = "🏙️ Cidade Rica, Povo com Fome";
    text = "A economia cresceu, mas a comida não chegou para todos.";
    future = "Esse cenário mostra que crescimento econômico sem distribuição justa pode manter a fome e aumentar a desigualdade.";
  } else if (stats.env < 45) {
    title = "🌵 O Preço da Produção";
    text = "A cidade produziu alimentos, mas sacrificou o futuro ambiental.";
    future = "No longo prazo, a falta de sustentabilidade prejudicaria a água, o solo e a produção agrícola.";
  } else {
    title = "🌾 Caminho Equilibrado";
    text = "A cidade sobreviveu aos 5 anos, mas ainda enfrenta desafios.";
    future = "Suas escolhas mostram que combater a fome exige equilíbrio entre produção, distribuição, economia e meio ambiente.";
  }

  document.getElementById("finalTitle").textContent = title;
  document.getElementById("finalText").textContent = text;
  document.getElementById("futureText").textContent = future;
}

function restartGame() {
  showScreen("home");
}