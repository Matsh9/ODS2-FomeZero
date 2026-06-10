const botao = document.getElementById("dado");
const resultado = document.getElementById("resultado");

botao.addEventListener("click", () => {
    const numero = Math.floor(Math.random() * 6) + 1;

    resultado.textContent =
        `Você tirou ${numero} no dado!`;
});