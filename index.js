const letters = document.querySelectorAll(".letter");
const lettersContainer = document.querySelector(".letters");
let zIndexCounter = 10;

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const shuffledThings = Array.from(letters);
shuffleArray(shuffledThings);

shuffledThings.forEach((letter) => {
  lettersContainer.appendChild(letter);
  
  // Utilizamos Pointer Events (el estándar moderno para táctil y ratón)
  letter.addEventListener("pointerdown", (e) => {
    // Evita arrastrar si toca el botón de cerrar o el enlace
    if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
    
    // Captura las coordenadas iniciales del elemento
    const rect = letter.getBoundingClientRect();
    
    letter.style.position = "fixed";
    letter.style.left = `${rect.left}px`;
    letter.style.top = `${rect.top}px`;

    // Calcula la distancia desde donde tocaste hasta el borde de la carta
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    letter.style.zIndex = zIndexCounter++;
    
    // Función que mueve la carta siguiendo el dedo
    const onPointerMove = (moveEvent) => {
      letter.style.left = `${moveEvent.clientX - offsetX}px`;
      letter.style.top = `${moveEvent.clientY - offsetY}px`;
    };
    
    // Función que suelta la carta al levantar el dedo
    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
    
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  });
});

// Lógica para abrir el sobre
document.querySelector("#openEnvelope").addEventListener("click", () => {
  document.querySelector(".envelope").classList.add("active");
  document.querySelector(".letters").classList.add("active");
});

// Lógica para cerrar cada carta
const closeButtons = document.querySelectorAll(".closeLetter");
closeButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const letter = e.target.closest(".letter");
    if (letter) {
      letter.style.display = "none";
    }
  });
});
