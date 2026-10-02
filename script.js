const photoChoices = [
    { name: 'Imagen 1', source: 'imagen 1.png' },
    { name: 'Imagen 2', source: 'imagen 2. png' },
    { name: 'Imagen 3', source: 'imagen 3. png' },
    { name: 'Imagen 4', source: 'imagen 4.png' },
];
const fallbackImageUrl = 'mi-foto.jpg';
let rows = 4;
let cols = 3;
let boardAspectRatio = 3 / 4;
const workspace = document.getElementById('puzzleWorkspace');
const boardFrame = document.getElementById('boardFrame');
const pieceTray = document.getElementById('pieceTray');
const pieceCount = document.getElementById('pieceCount');
const container = document.getElementById('container');
const imageChoicesElement = document.getElementById('imageChoices');
const imageHelp = document.getElementById('imageHelp');
const backgroundMusic = document.getElementById('backgroundMusic');
const musicButton = document.getElementById('playPauseButton');
const musicStatus = document.getElementById('musicStatus');
const loveMessages = [
    'Tú eres lo mejor que me ha pasado, mi Sibellyta hermosa.',
    'Contigo, hasta los días simples se vuelven inolvidables.',
    'Mi lugar favorito siempre será a tu lado.',
    'Cada pieza me recuerda cuánto te quiero.',
    'Gracias por llenar mi vida de alegría, mi amor.',
    'Elegirte es mi parte favorita de cada día.',
    'Tu sonrisa siempre será mi premio favorito.',
    'Este rompecabezas ya tiene su mejor pieza: tú.',
    'Mi suerte favorita fue encontrarte, Sibellyta.',
    'Te volvería a elegir en todas las vidas.'
];

let stage;
let layer;
let guideLayer;
let imageObj;
let puzzleImage;
let selectedPhoto = photoChoices[0];
let activeImageSource = selectedPhoto.source;
const photoAvailability = new Map();
let pieces = [];
let boardWidth = 0;
let boardHeight = 0;
let stageBaseWidth = 0;
let stageBaseHeight = 0;
let stageBoardWidth = 0;
let trayStartX = 0;
let trayStartY = 0;
let trayScale = 0.84;
let isStackedLayout = null;
let sloganInterval;
let horizontalEdges = [];
let verticalEdges = [];

function fitBoard() {
    if (!puzzleImage?.width || !puzzleImage?.height) return;

    const stackedLayout = window.innerWidth < 760;
    const imageRatio = puzzleImage.width / puzzleImage.height;
    const availableWidth = Math.max(200, window.innerWidth - 40);
    const maxBoardWidth = stackedLayout ? availableWidth : Math.min(760, (availableWidth - 20) / 2);
    const heightReserve = stackedLayout ? 175 : 260;
    const availableHeight = Math.max(260, window.innerHeight - heightReserve);
    const width = Math.min(maxBoardWidth, availableHeight * imageRatio);

    boardWidth = Math.round(width);
    boardHeight = Math.round(boardWidth / imageRatio);
    const pieceWidth = boardWidth / cols;
    const pieceHeight = boardHeight / rows;
    const tabSize = Math.min(pieceWidth, pieceHeight) * 0.19;
    const borderSize = 6;
    const gap = Math.round(tabSize * 0.8);
    const trayPadding = Math.max(10, Math.round(tabSize * 0.35));
    const trayHeaderHeight = Math.max(28, Math.round(tabSize * 1.6));
    trayScale = Math.min(0.82, (boardWidth + borderSize - 2 * trayPadding) / (boardWidth + 2 * tabSize));
    const trayContentWidth = (boardWidth + 2 * tabSize) * trayScale;
    const trayContentHeight = (boardHeight + 2 * tabSize) * trayScale;
    const trayWidth = boardWidth + borderSize;
    const trayHeight = trayHeaderHeight + 2 * trayPadding + trayContentHeight;
    const trayX = stackedLayout ? 0 : boardWidth + borderSize + gap;
    const trayY = stackedLayout ? boardHeight + borderSize + gap : 0;
    const workspaceWidth = stackedLayout ? Math.max(boardWidth + borderSize, trayWidth) : trayX + trayWidth;
    const workspaceHeight = stackedLayout ? trayY + trayHeight : Math.max(boardHeight + borderSize, trayHeight);

    trayStartX = trayX + (trayWidth - trayContentWidth) / 2 + tabSize * trayScale;
    trayStartY = trayY + trayHeaderHeight + trayPadding + tabSize * trayScale;
    workspace.style.width = `${workspaceWidth}px`;
    workspace.style.height = `${workspaceHeight}px`;
    boardFrame.style.width = `${boardWidth + borderSize}px`;
    boardFrame.style.height = `${boardHeight + borderSize}px`;
    pieceTray.style.left = `${trayX}px`;
    pieceTray.style.top = `${trayY}px`;
    pieceTray.style.width = `${trayWidth}px`;
    pieceTray.style.height = `${trayHeight}px`;
    pieceTray.querySelector('.tray-heading').style.top = `${trayPadding}px`;
    pieceTray.querySelector('.tray-heading').style.height = `${trayHeaderHeight}px`;
    container.style.width = `${workspaceWidth}px`;
    container.style.height = `${workspaceHeight}px`;

    if (stage) {
        const scale = boardWidth / stageBoardWidth;
        stage.size({ width: workspace.clientWidth, height: workspace.clientHeight });
        stage.scale({ x: scale, y: scale });
        stage.batchDraw();
    }

    isStackedLayout = stackedLayout;
}

function initGame() {
    if (stage) stage.destroy();
    stage = null;
    container.innerHTML = '';
    pieces = [];
    document.getElementById('previewButton').disabled = true;

    imageObj = new Image();
    imageObj.onload = () => {
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = imageObj.naturalWidth;
        let sourceHeight = imageObj.naturalHeight;
        const imageRatio = sourceWidth / sourceHeight;

        if (imageRatio < boardAspectRatio) {
            sourceHeight = sourceWidth / boardAspectRatio;
        } else {
            sourceWidth = sourceHeight * boardAspectRatio;
            sourceX = (imageObj.naturalWidth - sourceWidth) / 2;
        }

        puzzleImage = document.createElement('canvas');
        puzzleImage.width = Math.round(sourceWidth);
        puzzleImage.height = Math.round(sourceHeight);
        puzzleImage.getContext('2d').drawImage(
            imageObj,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            puzzleImage.width,
            puzzleImage.height
        );
        document.getElementById('previewButton').disabled = false;
        fitBoard();
        stageBaseWidth = workspace.clientWidth;
        stageBaseHeight = workspace.clientHeight;
        stageBoardWidth = boardWidth;
        stage = new Konva.Stage({
            container: 'container',
            width: stageBaseWidth,
            height: stageBaseHeight,
        });
        guideLayer = new Konva.Layer();
        layer = new Konva.Layer();
        stage.add(guideLayer);
        stage.add(layer);

        generateEdgeMatrix();
        createPieces();
        layer.draw();
    };
    imageObj.onerror = () => {
        const failedPhoto = photoChoices.find(photo => photo.source === activeImageSource);
        if (failedPhoto) {
            photoAvailability.set(failedPhoto, false);
            if (selectedPhoto === failedPhoto) selectedPhoto = null;
            activeImageSource = fallbackImageUrl;
            renderImageChoices();
            initGame();
            return;
        }
        container.textContent = `No se pudo cargar "${activeImageSource}". Coloca la imagen junto a index.html.`;
    };
    imageObj.src = activeImageSource;
}

function renderImageChoices() {
    imageChoicesElement.replaceChildren();
    let checkedPhotos = 0;
    let availablePhotos = 0;

    const updateImageHelp = () => {
        if (checkedPhotos < photoChoices.length) return;
        imageHelp.textContent = availablePhotos === photoChoices.length
            ? 'Las cuatro imágenes están disponibles.'
            : availablePhotos === 0
                ? 'Aún faltan las 4 imágenes; por ahora se muestra mi-foto.jpg.'
                : `${availablePhotos} de 4 imágenes disponibles; por ahora se muestra mi-foto.jpg.`;
    };

    photoChoices.forEach(photo => {
        const button = document.createElement('button');
        button.className = `image-choice${photo === selectedPhoto ? ' is-selected' : ''}`;
        button.type = 'button';
        button.disabled = photoAvailability.get(photo) === false || !photoAvailability.has(photo);
        button.setAttribute('aria-label', `Armar ${photo.name}`);
        button.setAttribute('aria-pressed', String(photo === selectedPhoto));
        button.title = photo.name;

        const thumbnail = document.createElement('img');
        thumbnail.alt = '';
        thumbnail.loading = 'lazy';

        const name = document.createElement('span');
        name.textContent = photo.name;
        button.append(thumbnail, name);
        if (photoAvailability.has(photo)) {
            const isAvailable = photoAvailability.get(photo);
            checkedPhotos++;
            if (isAvailable) {
                availablePhotos++;
                button.disabled = false;
                thumbnail.src = photo.source;
            } else {
                const placeholder = document.createElement('span');
                placeholder.className = 'image-missing';
                placeholder.textContent = 'PNG';
                thumbnail.replaceWith(placeholder);
            }
        } else {
            thumbnail.onload = () => {
                photoAvailability.set(photo, true);
                button.disabled = false;
                checkedPhotos++;
                availablePhotos++;
                updateImageHelp();
            };
            thumbnail.onerror = () => {
                photoAvailability.set(photo, false);
                const placeholder = document.createElement('span');
                placeholder.className = 'image-missing';
                placeholder.textContent = 'PNG';
                thumbnail.replaceWith(placeholder);
                button.disabled = true;
                checkedPhotos++;
                updateImageHelp();
            };
            thumbnail.src = photo.source;
        }
        button.addEventListener('click', () => {
            if (selectedPhoto === photo) return;
            selectedPhoto = photo;
            activeImageSource = photo.source;
            renderImageChoices();
            initGame();
        });
        imageChoicesElement.append(button);
    });
}

function generateEdgeMatrix() {
    horizontalEdges = Array.from({ length: rows - 1 }, () =>
        Array.from({ length: cols }, () => (Math.random() > 0.5 ? 1 : -1))
    );
    verticalEdges = Array.from({ length: rows }, () =>
        Array.from({ length: cols - 1 }, () => (Math.random() > 0.5 ? 1 : -1))
    );
}

function getPieceEdges(row, col) {
    return {
        top: row === 0 ? 0 : -horizontalEdges[row - 1][col],
        right: col === cols - 1 ? 0 : verticalEdges[row][col],
        bottom: row === rows - 1 ? 0 : horizontalEdges[row][col],
        left: col === 0 ? 0 : -verticalEdges[row][col - 1],
    };
}

function drawPiecePath(context, shape, edges, width, height, tabSize) {
    context.beginPath();
    context.moveTo(0, 0);

    if (edges.top) {
        context.lineTo(width * 0.35, 0);
        context.bezierCurveTo(width * 0.35, -edges.top * tabSize, width * 0.65, -edges.top * tabSize, width * 0.65, 0);
    }
    context.lineTo(width, 0);

    if (edges.right) {
        context.lineTo(width, height * 0.35);
        context.bezierCurveTo(width + edges.right * tabSize, height * 0.35, width + edges.right * tabSize, height * 0.65, width, height * 0.65);
    }
    context.lineTo(width, height);

    if (edges.bottom) {
        context.lineTo(width * 0.65, height);
        context.bezierCurveTo(width * 0.65, height + edges.bottom * tabSize, width * 0.35, height + edges.bottom * tabSize, width * 0.35, height);
    }
    context.lineTo(0, height);

    if (edges.left) {
        context.lineTo(0, height * 0.65);
        context.bezierCurveTo(-edges.left * tabSize, height * 0.65, -edges.left * tabSize, height * 0.35, 0, height * 0.35);
    }
    context.lineTo(0, 0);
    context.closePath();
    context.fillStrokeShape(shape);
}

function createPieceShape(row, col, pieceWidth, pieceHeight, tabSize, asGuide = false) {
    const edges = getPieceEdges(row, col);
    const shapeConfig = {
        width: pieceWidth,
        height: pieceHeight,
        sceneFunc: (context, shape) => drawPiecePath(context, shape, edges, pieceWidth, pieceHeight, tabSize),
        stroke: asGuide ? '#e879a8' : '#b52460',
        strokeWidth: asGuide ? 1.2 : 1.5,
        lineJoin: 'round',
    };

    if (asGuide) {
        shapeConfig.fill = '#fff8fb';
        shapeConfig.opacity = 0.38;
        shapeConfig.dash = [5, 5];
    } else {
        const texture = document.createElement('canvas');
        texture.width = Math.ceil(pieceWidth + tabSize * 2);
        texture.height = Math.ceil(pieceHeight + tabSize * 2);
        const textureContext = texture.getContext('2d');
        textureContext.drawImage(
            puzzleImage,
            tabSize - col * pieceWidth,
            tabSize - row * pieceHeight,
            boardWidth,
            boardHeight
        );
        shapeConfig.fillPatternImage = texture;
        shapeConfig.fillPatternOffset = { x: tabSize, y: tabSize };
    }

    return new Konva.Shape(shapeConfig);
}

function shuffledSlots(count) {
    const slots = Array.from({ length: count }, (_, index) => index);
    let hasFixedSlot = true;

    while (hasFixedSlot) {
        for (let index = slots.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [slots[index], slots[swapIndex]] = [slots[swapIndex], slots[index]];
        }
        hasFixedSlot = slots.some((slot, index) => slot === index);
    }

    return slots;
}

function createPieces() {
    pieces = [];
    const pieceWidth = boardWidth / cols;
    const pieceHeight = boardHeight / rows;
    const tabSize = Math.min(pieceWidth, pieceHeight) * 0.19;
    const totalPieces = rows * cols;
    const slots = shuffledSlots(totalPieces);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const targetX = 3 + col * pieceWidth;
            const targetY = 3 + row * pieceHeight;
            const guide = createPieceShape(row, col, pieceWidth, pieceHeight, tabSize, true);
            guide.position({ x: targetX, y: targetY });
            guideLayer.add(guide);
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const pieceIndex = row * cols + col;
            const spawnIndex = slots[pieceIndex];
            const spawnRow = Math.floor(spawnIndex / cols);
            const spawnCol = spawnIndex % cols;
            const targetX = 3 + col * pieceWidth;
            const targetY = 3 + row * pieceHeight;
            const group = new Konva.Group({
                x: trayStartX + spawnCol * pieceWidth * trayScale,
                y: trayStartY + spawnRow * pieceHeight * trayScale,
                scaleX: trayScale,
                scaleY: trayScale,
                draggable: true,
            });

            group.add(createPieceShape(row, col, pieceWidth, pieceHeight, tabSize));
            group.correctX = targetX;
            group.correctY = targetY;
            group.isLocked = false;
            layer.add(group);
            pieces.push(group);

            group.on('dragstart', () => group.moveToTop());
            group.on('dragmove', () => {
                group.x(Math.max(0, Math.min(stageBaseWidth - pieceWidth, group.x())));
                group.y(Math.max(0, Math.min(stageBaseHeight - pieceHeight, group.y())));
            });
            group.on('dragend', () => {
                const snapDistance = Math.min(pieceWidth, pieceHeight) * 0.23;
                const closeX = Math.abs(group.x() - group.correctX) < snapDistance;
                const closeY = Math.abs(group.y() - group.correctY) < snapDistance;

                if (closeX && closeY) {
                    group.position({ x: group.correctX, y: group.correctY });
                    group.scale({ x: 1, y: 1 });
                    group.isLocked = true;
                    group.draggable(false);
                    group.moveToBottom();
                }

                layer.batchDraw();
                updatePieceCount();
                checkWin();
            });
        }
    }

    updatePieceCount();
}

function updatePieceCount() {
    const remaining = pieces.filter(piece => !piece.isLocked).length;
    pieceCount.textContent = remaining === 1 ? '1 disponible' : `${remaining} disponibles`;
}

function checkWin() {
    const modal = document.getElementById('completionModal');
    if (pieces.length && pieces.every(piece => piece.isLocked) && !modal.classList.contains('is-open')) {
        rollLoveMessage();
        modal.classList.add('is-open');
    }
}

function rollLoveMessage() {
    const messageElement = document.getElementById('winSlogan');
    const winningMessage = loveMessages[Math.floor(Math.random() * loveMessages.length)];
    if (sloganInterval) clearInterval(sloganInterval);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        messageElement.textContent = winningMessage;
        return;
    }

    let spins = 0;
    messageElement.classList.add('is-rolling');
    sloganInterval = setInterval(() => {
        messageElement.textContent = loveMessages[Math.floor(Math.random() * loveMessages.length)];
        spins++;
        if (spins >= 14) {
            clearInterval(sloganInterval);
            sloganInterval = null;
            messageElement.textContent = winningMessage;
            messageElement.classList.remove('is-rolling');
        }
    }, 90);
}

document.querySelectorAll('.difficulty-option').forEach(button => {
    button.addEventListener('click', () => {
        const pieceTotal = Number(button.dataset.pieceCount);
        rows = pieceTotal === 48 ? 8 : pieceTotal === 24 ? 6 : 4;
        cols = pieceTotal === 48 ? 6 : pieceTotal === 24 ? 4 : 3;
        boardAspectRatio = cols / rows;
        document.querySelectorAll('.difficulty-option').forEach(option => {
            const selected = option === button;
            option.classList.toggle('is-selected', selected);
            option.setAttribute('aria-pressed', String(selected));
        });
        closeModal('completionModal');
        initGame();
    });
});

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('is-open');
}

document.getElementById('resetButton').addEventListener('click', () => {
    closeModal('completionModal');
    document.getElementById('winSlogan').classList.remove('is-rolling');
    if (sloganInterval) clearInterval(sloganInterval);
    initGame();
});

document.getElementById('previewButton').addEventListener('click', () => {
    document.getElementById('previewImage').src = puzzleImage.toDataURL('image/jpeg', 0.94);
    document.getElementById('previewModal').classList.add('is-open');
});

function updateMusicButton() {
    const isPlaying = !backgroundMusic.paused && !backgroundMusic.error;
    musicButton.textContent = isPlaying ? 'Ⅱ' : '♫';
    musicButton.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Reproducir música');
    musicButton.setAttribute('title', isPlaying ? 'Pausar música' : 'Reproducir música');
    musicButton.setAttribute('aria-pressed', String(isPlaying));
}

musicButton.addEventListener('click', async () => {
    if (!backgroundMusic.paused) {
        backgroundMusic.pause();
        musicStatus.hidden = true;
        musicStatus.textContent = '';
        return;
    }

    try {
        await backgroundMusic.play();
        musicStatus.hidden = true;
        musicStatus.textContent = '';
    } catch {
        updateMusicButton();
        musicStatus.hidden = false;
        musicStatus.textContent = 'No se pudo reproducir amor.mp3. Coloca el archivo junto a index.html.';
    }
});

backgroundMusic.addEventListener('play', updateMusicButton);
backgroundMusic.addEventListener('pause', updateMusicButton);
backgroundMusic.addEventListener('error', () => {
    updateMusicButton();
    musicStatus.hidden = false;
    musicStatus.textContent = 'No se pudo cargar amor.mp3. Coloca el archivo junto a index.html.';
});

document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.close));
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
        if (event.target === modal) modal.classList.remove('is-open');
    });
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal.is-open').forEach(modal => modal.classList.remove('is-open'));
    }
});

const bgCanvas = document.getElementById('backgroundCanvas');
const bgCtx = bgCanvas.getContext('2d');
let bgWidth = 0;
let bgHeight = 0;
let particles = [];

function resizeBackground() {
    const pixelRatio = window.devicePixelRatio || 1;
    bgWidth = window.innerWidth;
    bgHeight = window.innerHeight;
    bgCanvas.width = Math.round(bgWidth * pixelRatio);
    bgCanvas.height = Math.round(bgHeight * pixelRatio);
    bgCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

class Particle {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * bgWidth;
        this.y = initial ? Math.random() * bgHeight : bgHeight + Math.random() * 80;
        this.size = Math.random() * 12 + 5;
        this.speedY = Math.random() * 0.8 + 0.35;
        this.speedX = (Math.random() - 0.5) * 0.45;
        this.opacity = Math.random() * 0.38 + 0.2;
        this.type = Math.random() > 0.48 ? 'heart' : 'star';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.018;
    }

    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y < -30) this.reset();
    }

    draw() {
        bgCtx.save();
        bgCtx.translate(this.x, this.y);
        bgCtx.rotate(this.rotation);
        bgCtx.globalAlpha = this.opacity;

        if (this.type === 'heart') {
            const size = this.size;
            bgCtx.fillStyle = '#dc3478';
            bgCtx.beginPath();
            bgCtx.moveTo(0, size * 0.28);
            bgCtx.bezierCurveTo(0, -size * 0.08, -size * 0.55, -size * 0.08, -size * 0.55, size * 0.3);
            bgCtx.bezierCurveTo(-size * 0.55, size * 0.63, 0, size * 0.92, 0, size * 1.2);
            bgCtx.bezierCurveTo(0, size * 0.92, size * 0.55, size * 0.63, size * 0.55, size * 0.3);
            bgCtx.bezierCurveTo(size * 0.55, -size * 0.08, 0, -size * 0.08, 0, size * 0.28);
            bgCtx.fill();
        } else {
            const size = this.size * 0.6;
            bgCtx.fillStyle = '#fff';
            bgCtx.beginPath();
            for (let point = 0; point < 8; point++) {
                const radius = point % 2 === 0 ? size : size * 0.25;
                const angle = (Math.PI * point) / 4;
                bgCtx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            bgCtx.closePath();
            bgCtx.fill();
        }

        bgCtx.restore();
    }
}

function animateBackground() {
    bgCtx.clearRect(0, 0, bgWidth, bgHeight);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animateBackground);
}

resizeBackground();
particles = Array.from({ length: 42 }, () => new Particle());
animateBackground();
renderImageChoices();
initGame();

window.addEventListener('resize', () => {
    resizeBackground();
    const previousLayout = isStackedLayout;
    fitBoard();
    if (stage && previousLayout !== isStackedLayout) initGame();
});