let alimentos = 100;
let populacao = 100;
let sustentabilidade = 50;

const eventos = [
    {
        texto: "Uma ONG oferece sementes sustentáveis.",
        opcoes: [
            {
                texto: "Aceitar",
                alimentos: 20,
                sustentabilidade: 15
            },
            {
                texto: "Recusar",
                alimentos: -10,
                sustentabilidade: -10
            }
        ]
    },

    {
        texto: "Parte da colheita foi desperdiçada.",
        opcoes: [
            {
                texto: "Investir em armazenamento",
                alimentos: 10,
                sustentabilidade: 10
            },
            {
                texto: "Ignorar",
                alimentos: -20,
                sustentabilidade: -10
            }
        ]
    },

    {
        texto: "A população aumentou.",
        opcoes: [
            {
                texto: "Expandir produção",
                alimentos: -10,
                sustentabilidade: 5
            },
            {
                texto: "Não expandir",
                alimentos: -30,
                sustentabilidade: -5
            }
        ]
    }
];

function atualizarPainel() {
    document.getElementById("alimentos").textContent = alimentos;
    document.getElementById("populacao").textContent = populacao;
    document.getElementById("sustentabilidade").textContent = sustentabilidade;
}

function mostrarTela(id) {

    document.querySelectorAll(".tela").forEach(tela => {
        tela.classList.remove("ativa");
    });

    document.getElementById(id).classList.add("ativa");
}

function carregarEvento() {

    const evento =
        eventos[Math.floor(Math.random() * eventos.length)];

    document.getElementById("evento").textContent =
        evento.texto;

    const opcoesDiv =
        document.getElementById("opcoes");

    opcoesDiv.innerHTML = "";

    evento.opcoes.forEach(opcao => {

        const botao =
            document.createElement("button");

        botao.textContent =
            opcao.texto;

        botao.onclick = () => {

            alimentos += opcao.alimentos || 0;
            sustentabilidade += opcao.sustentabilidade || 0;

            atualizarPainel();

            opcoesDiv.innerHTML =
                "<p>Decisão registrada.</p>";
        };

        opcoesDiv.appendChild(botao);
    });
}

function gerarSimulacao() {

    let resultado = "";

    if (sustentabilidade >= 70 && alimentos >= 120) {

        resultado =
            "Após 5 anos, a comunidade prosperou. A fome diminuiu significativamente e a produção agrícola permaneceu sustentável.";

    } else if (sustentabilidade >= 50) {

        resultado =
            "Após 5 anos, a comunidade conseguiu manter o abastecimento, mas ainda enfrenta desafios de distribuição.";

    } else {

        resultado =
            "Após 5 anos, houve aumento da insegurança alimentar, desperdício de recursos e dificuldades de produção.";

    }

    document.getElementById("resultadoFinal")
        .textContent = resultado;
}

document
    .getElementById("sortearEvento")
    .addEventListener("click", carregarEvento);

atualizarPainel();