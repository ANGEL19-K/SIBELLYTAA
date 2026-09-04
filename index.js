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
  
  // Soporte para arrastrar con dedo (Touch) o con Mouse
  const handleDragStart = (e) => {
    // Evita arrastrar si toca el botón de cerrar o el link de la música
    if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
    
    const isTouch = e.type === "touchstart";
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const rect = letter.getBoundingClientRect();

    letter.style.position = "fixed";
    letter.style.left = `${rect.left}px`;
    letter.style.top = `${rect.top}px`;

    let offsetX = clientX - rect.left;
    let offsetY = clientY - rect.top;

    letter.style.zIndex = zIndexCounter++;
    
    const moveAt = (posX, posY) => {
      letter.style.left = `${posX - offsetX}px`;
      letter.style.top = `${posY - offsetY}px`;
    };
    
    const onMove = (moveEvent) => {
      const moveX = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = isTouch ? moveEvent.touches[0].clientY : moveEvent.clientY;
      moveAt(moveX, moveY);
    };
    
    const onEnd = () => {
      document.removeEventListener(isTouch ? "touchmove" : "mousemove", onMove);
      document.removeEventListener(isTouch ? "touchend" : "mouseup", onEnd);
    };
    
    document.addEventListener(isTouch ? "touchmove" : "mousemove", onMove, { passive: false });
    document.addEventListener(isTouch ? "touchend" : "mouseup", onEnd);
  };

  letter.addEventListener("mousedown", handleDragStart);
  letter.addEventListener("touchstart", handleDragStart, { passive: true });
});

document.querySelector("#openEnvelope").addEventListener("click", () => {
  document.querySelector(".envelope").classList.add("active");
  document.querySelector(".letters").classList.add("active");
});

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
