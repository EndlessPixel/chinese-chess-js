// 棋盘配置
const BOARD_WIDTH = 9;
const BOARD_HEIGHT = 10;
let CELL_SIZE, PIECE_SIZE;

// 棋子价值表（用于AI决策）
const PIECE_VALUES = {
    '帅': 1000, '将': 1000,
    '車': 90, '车': 90,
    '马': 45, '馬': 45,
    '炮': 40, '炮': 40,
    '相': 20, '象': 20,
    '仕': 20, '士': 20,
    '兵': 10, '卒': 10
};

// 初始棋子位置
const initialPieces = {
    red: {
        '车': [[0, 9], [8, 9]],
        '马': [[1, 9], [7, 9]],
        '相': [[2, 9], [6, 9]],
        '仕': [[3, 9], [5, 9]],
        '帅': [[4, 9]],
        '炮': [[1, 7], [7, 7]],
        '兵': [[0, 6], [2, 6], [4, 6], [6, 6], [8, 6]]
    },
    black: {
        '車': [[0, 0], [8, 0]],
        '馬': [[1, 0], [7, 0]],
        '象': [[2, 0], [6, 0]],
        '士': [[3, 0], [5, 0]],
        '将': [[4, 0]],
        '炮': [[1, 2], [7, 2]],
        '卒': [[0, 3], [2, 3], [4, 3], [6, 3], [8, 3]]
    }
};

// 游戏状态
let gameState = {
    pieces: {},
    selectedPiece: null,
    currentTurn: 'red',
    moveHistory: [],
    aiThinking: false,
    gameOver: false,
    timer: null,
    timeElapsed: 0,
    showHints: false
};

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    initBoard();
    resetGame();
    startTimer();
});

// 自适应棋盘大小
function calculateSizes() {
    const board = document.getElementById('board');
    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;

    CELL_SIZE = boardWidth / BOARD_WIDTH;
    PIECE_SIZE = Math.min(CELL_SIZE * 0.8, boardHeight / BOARD_HEIGHT * 0.8);
}

// 初始化棋盘
function initBoard() {
    const board = document.getElementById('board');
    calculateSizes();

    // 清空棋盘
    board.innerHTML = '<div class="river">楚河 · 汉界</div><div class="move-hint" id="moveHint"></div>';

    // 绘制横线
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line horizontal';
        line.style.top = `${i * (board.clientHeight / BOARD_HEIGHT)}px`;

        // 九宫格横线特殊处理
        if ((i === 7 || i === 8) && board.clientWidth >= 300) {
            line.style.width = `${CELL_SIZE * 5}px`;
            line.style.left = `${CELL_SIZE * 2}px`;
        }
        if ((i === 1 || i === 2) && board.clientWidth >= 300) {
            line.style.width = `${CELL_SIZE * 5}px`;
            line.style.left = `${CELL_SIZE * 2}px`;
        }

        board.appendChild(line);
    }

    // 绘制竖线
    for (let j = 0; j < BOARD_WIDTH; j++) {
        const line = document.createElement('div');
        line.className = 'grid-line vertical';
        line.style.left = `${j * CELL_SIZE}px`;

        // 河界竖线断开
        if (j < BOARD_WIDTH) {
            if (j === 0 || j === 8) {
                line.style.height = '100%';
            } else {
                // 上半部分
                const topLine = line.cloneNode();
                topLine.style.height = `${board.clientHeight / 2 - 5}px`;
                topLine.style.top = '0';
                board.appendChild(topLine);

                // 下半部分
                const bottomLine = line.cloneNode();
                bottomLine.style.height = `${board.clientHeight / 2 - 5}px`;
                bottomLine.style.top = `${board.clientHeight / 2 + 5}px`;
                continue;
            }
        }

        board.appendChild(line);
    }

    // 绘制九宫格斜线
    drawDiagonalLines(board);
}

// 绘制九宫格斜线
function drawDiagonalLines(board) {
    if (board.clientWidth < 300) return; // 小屏幕不显示斜线

    // 红方九宫格
    const redDiag1 = createDiagonalLine(3 * CELL_SIZE, 7 * CELL_SIZE, 45);
    const redDiag2 = createDiagonalLine(5 * CELL_SIZE, 7 * CELL_SIZE, -45);

    // 黑方九宫格
    const blackDiag1 = createDiagonalLine(3 * CELL_SIZE, 2 * CELL_SIZE, -45);
    const blackDiag2 = createDiagonalLine(5 * CELL_SIZE, 2 * CELL_SIZE, 45);

    board.appendChild(redDiag1);
    board.appendChild(redDiag2);
    board.appendChild(blackDiag1);
    board.appendChild(blackDiag2);
}

function createDiagonalLine(x, y, angle) {
    const line = document.createElement('div');
    line.className = 'grid-line';
    line.style.width = `${Math.sqrt(2) * CELL_SIZE * 2}px`;
    line.style.height = '1px';
    line.style.left = `${x}px`;
    line.style.top = `${y}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    return line;
}

// 初始化棋子
function initPieces() {
    gameState.pieces = {};
    const board = document.getElementById('board');

    // 创建红方棋子
    for (const [name, positions] of Object.entries(initialPieces.red)) {
        positions.forEach((pos, index) => {
            const id = `red-${name}-${index}`;
            const piece = createPieceElement(id, name, 'red', pos);
            gameState.pieces[id] = {
                id,
                element: piece,
                name,
                color: 'red',
                position: [...pos],
                originalPosition: [...pos]
            };
            board.appendChild(piece);
        });
    }

    // 创建黑方棋子
    for (const [name, positions] of Object.entries(initialPieces.black)) {
        positions.forEach((pos, index) => {
            const id = `black-${name}-${index}`;
            const piece = createPieceElement(id, name, 'black', pos);
            gameState.pieces[id] = {
                id,
                element: piece,
                name,
                color: 'black',
                position: [...pos],
                originalPosition: [...pos]
            };
            board.appendChild(piece);
        });
    }
}

// 创建棋子元素
function createPieceElement(id, name, color, position) {
    const piece = document.createElement('div');
    piece.id = id;
    piece.className = `piece ${color}`;
    piece.textContent = name;
    piece.dataset.x = position[0];
    piece.dataset.y = position[1];

    // 设置位置
    updatePiecePosition(piece, position);

    // 点击事件
    piece.addEventListener('click', () => handlePieceClick(id));

    return piece;
}

// 更新棋子位置
function updatePiecePosition(pieceElement, position) {
    const [x, y] = position;
    pieceElement.style.left = `${x * CELL_SIZE + CELL_SIZE / 2}px`;
    pieceElement.style.top = `${y * CELL_SIZE + (CELL_SIZE * BOARD_HEIGHT / BOARD_WIDTH) / 2}px`;
    pieceElement.style.transform = 'translate(-50%, -50%)';
    pieceElement.dataset.x = x;
    pieceElement.dataset.y = y;
}

// 处理棋子点击
function handlePieceClick(pieceId) {
    if (gameState.aiThinking || gameState.gameOver) return;

    const piece = gameState.pieces[pieceId];

    // 点击的是当前回合的棋子
    if (piece.color === gameState.currentTurn) {
        // 取消之前的选择
        if (gameState.selectedPiece) {
            gameState.selectedPiece.element.classList.remove('selected');
            hideMoveHints();
        }

        // 选择新棋子
        gameState.selectedPiece = piece;
        piece.element.classList.add('selected');

        // 显示可移动位置
        if (gameState.showHints) {
            showValidMoves(piece);
        }
    }
    // 点击的是对方棋子或空位置，尝试移动
    else if (gameState.selectedPiece) {
        attemptMove(gameState.selectedPiece, piece ? piece.position : null);
    }
}

// 点击棋盘空白处移动
document.getElementById('board').addEventListener('click', function (e) {
    if (gameState.aiThinking || gameState.gameOver || !gameState.selectedPiece) return;

    // 忽略点击到棋子、河界、提示点的情况
    if (e.target.classList.contains('piece') ||
        e.target.classList.contains('river') ||
        e.target.classList.contains('move-hint')) {
        return;
    }

    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算点击的棋盘坐标
    const col = Math.round((x - CELL_SIZE / 2) / CELL_SIZE);
    const row = Math.round((y - (CELL_SIZE * BOARD_HEIGHT / BOARD_WIDTH) / 2) / CELL_SIZE);

    // 检查坐标有效性
    if (col >= 0 && col < BOARD_WIDTH && row >= 0 && row < BOARD_HEIGHT) {
        attemptMove(gameState.selectedPiece, [col, row]);
    }
});

// 尝试移动棋子
function attemptMove(piece, targetPos) {
    if (!piece || !targetPos) return;

    const [startX, startY] = piece.position;
    const [endX, endY] = targetPos;

    // 检查移动有效性
    if (!isValidMove(piece, startX, startY, endX, endY)) {
        return;
    }

    // 检查目标位置的棋子
    const targetPiece = getPieceAtPosition(endX, endY);

    // 记录移动历史
    gameState.moveHistory.push({
        piece: { ...piece },
        from: [startX, startY],
        to: [endX, endY],
        captured: targetPiece ? { ...targetPiece } : null
    });

    // 执行移动
    executeMove(piece, [endX, endY], targetPiece);

    // 检查是否获胜
    // function/attemptMove.js 中「检查是否获胜」部分
    // 修复点1：接收 checkWin 返回的获胜方（而非布尔值）
    // 修复点2：根据获胜方判定输赢，而非当前回合
    // 修复点3：适配全局 gameState.currentTurn（拆分后无全局 currentTurn 变量）
    const winner = checkWin(); // 接收获胜方
    if (winner) {
        setTimeout(() => {
            // 直接根据 winner 判定，不再依赖 currentTurn
            alert(`${winner === 'red' ? '红方（玩家）' : '黑方（AI）'}获胜！`);
            resetGame();
        }, 100);
        return;
    }

    // 切换回合
    switchTurn();
}

// 执行移动
function executeMove(piece, targetPos, targetPiece) {
    const [endX, endY] = targetPos;

    // 吃子
    if (targetPiece) {
        targetPiece.element.classList.add('captured');
        setTimeout(() => {
            targetPiece.element.remove();
            delete gameState.pieces[targetPiece.id];
        }, 300);
    }

    // 移动棋子
    piece.position = [endX, endY];
    updatePiecePosition(piece.element, targetPos);

    // 取消选择
    piece.element.classList.remove('selected');
    gameState.selectedPiece = null;
    hideMoveHints();
}

// 切换回合
function switchTurn() {
    // 切换当前回合
    gameState.currentTurn = gameState.currentTurn === 'red' ? 'black' : 'red';
    updateStatus();

    // AI回合
    if (gameState.currentTurn === 'black' && !gameState.gameOver) {
        setTimeout(makeAIMove, 200);
    }
}

// AI移动（智能版）
function makeAIMove() {
    if (gameState.gameOver) return;

    gameState.aiThinking = true;
    document.getElementById('thinking').style.display = 'block';

    setTimeout(() => {
        const blackPieces = Object.values(gameState.pieces).filter(p => p.color === 'black');
        const possibleMoves = [];

        // 生成所有可能的移动
        blackPieces.forEach(piece => {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                for (let y = 0; y < BOARD_HEIGHT; y++) {
                    if (isValidMove(piece, piece.position[0], piece.position[1], x, y)) {
                        const targetPiece = getPieceAtPosition(x, y);
                        let moveValue = 0;

                        // 计算移动价值
                        if (targetPiece) {
                            // 吃子价值
                            moveValue = PIECE_VALUES[targetPiece.name];

                            // 吃到将/帅直接获胜
                            if (targetPiece.name === '帅') {
                                moveValue = 10000;
                            }
                        } else {
                            // 位置价值（靠近对方老将加分）
                            moveValue = calculatePositionValue(piece, x, y);

                            // 保护己方老将加分
                            moveValue += calculateDefenseValue(piece, x, y);
                        }

                        possibleMoves.push({
                            piece,
                            to: [x, y],
                            value: moveValue
                        });
                    }
                }
            }
        });

        // 执行最佳移动
        if (possibleMoves.length > 0) {
            // 按价值排序，优先高价值移动
            possibleMoves.sort((a, b) => b.value - a.value);

            // 随机选择前3个最佳移动之一，增加AI的不确定性
            const topMoves = possibleMoves.slice(0, Math.min(3, possibleMoves.length));
            const bestMove = topMoves[Math.floor(Math.random() * topMoves.length)];

            // 执行移动
            setTimeout(() => {
                gameState.selectedPiece = bestMove.piece;
                bestMove.piece.element.classList.add('selected');

                setTimeout(() => {
                    attemptMove(bestMove.piece, bestMove.to);
                    gameState.aiThinking = false;
                    document.getElementById('thinking').style.display = 'none';
                }, 500);
            }, 300);
        } else {
            gameState.aiThinking = false;
            document.getElementById('thinking').style.display = 'none';
        }
    }, 800);
}

// 计算位置价值
function calculatePositionValue(piece, x, y) {
    let value = 0;

    // 靠近对方老将加分
    const enemyKing = Object.values(gameState.pieces).find(
        p => p.color !== piece.color && (p.name === '帅' || p.name === '将')
    );

    if (enemyKing) {
        const distance = Math.sqrt(
            Math.pow(x - enemyKing.position[0], 2) +
            Math.pow(y - enemyKing.position[1], 2)
        );
        value += Math.max(0, 20 - distance * 2);
    }

    // 車、炮在中间位置加分
    if ((piece.name === '車' || piece.name === '炮') && x === 4) {
        value += 5;
    }

    return value;
}

// 计算防御价值
function calculateDefenseValue(piece, x, y) {
    let value = 0;

    // 保护己方老将
    const ownKing = Object.values(gameState.pieces).find(
        p => p.color === piece.color && (p.name === '帅' || p.name === '将')
    );

    if (ownKing) {
        // 士、象在老将周围加分
        if ((piece.name === '士' || piece.name === '象' || piece.name === '相') &&
            Math.abs(x - ownKing.position[0]) <= 2 &&
            Math.abs(y - ownKing.position[1]) <= 2) {
            value += 8;
        }
    }

    return value;
}

// 检查移动是否有效（完整规则）
function isValidMove(piece, startX, startY, endX, endY) {
    // 不能移动到原位置
    if (startX === endX && startY === endY) return false;

    // 目标位置有己方棋子
    const targetPiece = getPieceAtPosition(endX, endY);
    if (targetPiece && targetPiece.color === piece.color) return false;

    // 根据棋子类型检查规则
    switch (piece.name) {
        case '帅':
        case '将':
            return isValidKingMove(piece, startX, startY, endX, endY);
        case '仕':
        case '士':
            return isValidAdvisorMove(piece, startX, startY, endX, endY);
        case '相':
        case '象':
            return isValidElephantMove(piece, startX, startY, endX, endY);
        case '马':
        case '馬':
            return isValidHorseMove(piece, startX, startY, endX, endY);
        case '车':
        case '車':
            return isValidChariotMove(piece, startX, startY, endX, endY);
        case '炮':
            return isValidCannonMove(piece, startX, startY, endX, endY);
        case '兵':
        case '卒':
            return isValidSoldierMove(piece, startX, startY, endX, endY);
        default:
            return false;
    }
}

// 帅/将移动规则
function isValidKingMove(piece, startX, startY, endX, endY) {
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);

    // 只能走一步（横竖）
    if (dx + dy !== 1) return false;

    // 只能在九宫格内
    const isRedKing = piece.color === 'red';
    if ((isRedKing && (endX < 3 || endX > 5 || endY < 7 || endY > 9)) ||
        (!isRedKing && (endX < 3 || endX > 5 || endY < 0 || endY > 2))) {
        return false;
    }

    // 检查将帅是否照面
    if (isKingsFacingEachOther(piece, endX, endY)) {
        return false;
    }

    return true;
}

// 检查将帅是否照面
function isKingsFacingEachOther(movingKing, targetX, targetY) {
    const enemyKing = Object.values(gameState.pieces).find(
        p => p.color !== movingKing.color && (p.name === '帅' || p.name === '将')
    );

    if (!enemyKing) return false;

    // 移动后的将/帅位置
    const kingX = movingKing.name === '帅' || movingKing.name === '将' ? targetX : movingKing.position[0];
    const kingY = movingKing.name === '帅' || movingKing.name === '将' ? targetY : movingKing.position[1];

    // 不在同一列，不会照面
    if (kingX !== enemyKing.position[0]) return false;

    // 检查中间是否有棋子阻隔
    const minY = Math.min(kingY, enemyKing.position[1]);
    const maxY = Math.max(kingY, enemyKing.position[1]);

    for (let y = minY + 1; y < maxY; y++) {
        if (getPieceAtPosition(kingX, y)) {
            return false; // 有阻隔，不会照面
        }
    }

    return true; // 无阻隔，照面了
}

// 仕/士移动规则
function isValidAdvisorMove(piece, startX, startY, endX, endY) {
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);

    // 只能斜走一步
    if (dx !== 1 || dy !== 1) return false;

    // 只能在九宫格内
    const isRed = piece.color === 'red';
    if ((isRed && (endX < 3 || endX > 5 || endY < 7 || endY > 9)) ||
        (!isRed && (endX < 3 || endX > 5 || endY < 0 || endY > 2))) {
        return false;
    }

    return true;
}

// 相/象移动规则
function isValidElephantMove(piece, startX, startY, endX, endY) {
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);

    // 只能斜走两步
    if (dx !== 2 || dy !== 2) return false;

    // 不能过河
    const isRed = piece.color === 'red';
    if ((isRed && endY < 5) || (!isRed && endY > 4)) {
        return false;
    }

    // 检查象眼是否有棋子
    const midX = startX + (endX - startX) / 2;
    const midY = startY + (endY - startY) / 2;

    if (getPieceAtPosition(midX, midY)) {
        return false;
    }

    return true;
}

// 马移动规则
function isValidHorseMove(piece, startX, startY, endX, endY) {
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);

    // 马走日（1+2）
    if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) {
        return false;
    }

    // 检查马腿是否被绊
    let blockX, blockY;
    if (dx === 2) {
        blockX = startX + (endX - startX) / 2;
        blockY = startY;
    } else {
        blockX = startX;
        blockY = startY + (endY - startY) / 2;
    }

    if (getPieceAtPosition(blockX, blockY)) {
        return false;
    }

    return true;
}

// 车移动规则
function isValidChariotMove(piece, startX, startY, endX, endY) {
    // 只能横竖走
    if (startX !== endX && startY !== endY) return false;

    // 检查路径是否有棋子阻隔
    const stepX = startX === endX ? 0 : (endX - startX) / Math.abs(endX - startX);
    const stepY = startY === endY ? 0 : (endY - startY) / Math.abs(endY - startY);

    let x = startX + stepX;
    let y = startY + stepY;

    while (x !== endX || y !== endY) {
        if (getPieceAtPosition(x, y)) {
            return false;
        }
        x += stepX;
        y += stepY;
    }

    return true;
}

// 炮移动规则
function isValidCannonMove(piece, startX, startY, endX, endY) {
    // 只能横竖走
    if (startX !== endX && startY !== endY) return false;

    // 统计路径上的棋子数
    let obstacleCount = 0;
    const stepX = startX === endX ? 0 : (endX - startX) / Math.abs(endX - startX);
    const stepY = startY === endY ? 0 : (endY - startY) / Math.abs(endY - startY);

    let x = startX + stepX;
    let y = startY + stepY;

    while (x !== endX || y !== endY) {
        if (getPieceAtPosition(x, y)) {
            obstacleCount++;
            if (obstacleCount > 1) break;
        }
        x += stepX;
        y += stepY;
    }

    const targetPiece = getPieceAtPosition(endX, endY);

    // 不吃子：路径上无棋子
    if (!targetPiece) {
        return obstacleCount === 0;
    }
    // 吃子：路径上必须有且仅有一个棋子
    else {
        return obstacleCount === 1;
    }
}

// 兵/卒移动规则
function isValidSoldierMove(piece, startX, startY, endX, endY) {
    const dx = endX - startX;
    const dy = endY - startY;

    // 只能走一步
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

    const isRed = piece.color === 'red';

    // 未过河：只能前进
    if ((isRed && startY > 4 && dy >= 0) || (!isRed && startY < 5 && dy <= 0)) {
        return false;
    }

    // 过河后：可以横向移动
    if ((isRed && startY <= 4 && dx !== 0) || (!isRed && startY >= 5 && dx !== 0)) {
        return true;
    }

    // 前进方向检查
    return (isRed && dy < 0) || (!isRed && dy > 0);
}

// 获取指定位置的棋子
function getPieceAtPosition(x, y) {
    return Object.values(gameState.pieces).find(
        p => p.position[0] === x && p.position[1] === y
    );
}

// 显示可移动位置
function showValidMoves(piece) {
    const hint = document.getElementById('moveHint');
    hint.style.display = 'none';

    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (isValidMove(piece, piece.position[0], piece.position[1], x, y)) {
                const hintClone = hint.cloneNode();
                hintClone.id = `hint-${x}-${y}`;
                hintClone.style.left = `${x * CELL_SIZE + CELL_SIZE / 2}px`;
                hintClone.style.top = `${y * CELL_SIZE + (CELL_SIZE * BOARD_HEIGHT / BOARD_WIDTH) / 2}px`;
                hintClone.style.display = 'block';

                // 点击提示点移动
                hintClone.addEventListener('click', () => {
                    attemptMove(piece, [x, y]);
                });

                document.getElementById('board').appendChild(hintClone);
            }
        }
    }
}

// 隐藏可移动位置提示
function hideMoveHints() {
    document.querySelectorAll('.move-hint').forEach(hint => {
        if (hint.id !== 'moveHint') {
            hint.remove();
        } else {
            hint.style.display = 'none';
        }
    });
}

// 切换显示/隐藏可移动位置
function showMoveHints() {
    gameState.showHints = !gameState.showHints;

    if (gameState.showHints && gameState.selectedPiece) {
        showValidMoves(gameState.selectedPiece);
    } else {
        hideMoveHints();
    }
}

// 修复点1：从全局 gameState.pieces 取值（拆分后不再有全局 pieces 变量）
// 修复点2：返回获胜方（而非布尔值），避免判定逻辑错乱
function checkWin() {
    // 红方帅是否存在（精准匹配，红方只有"帅"，黑方只有"将"）
    const redKingExists = Object.values(gameState.pieces).some(p =>
        p.color === 'red' && p.name === '帅'
    );
    // 黑方将是否存在
    const blackKingExists = Object.values(gameState.pieces).some(p =>
        p.color === 'black' && p.name === '将'
    );

    // 返回具体获胜方，而非单纯的 true/false
    if (!redKingExists) return 'black'; // 红帅没了 → 黑方赢
    if (!blackKingExists) return 'red'; // 黑将没了 → 红方赢
    return null; // 都在，游戏继续
}

// 结束游戏
function endGame(message) {
    gameState.gameOver = true;
    stopTimer();

    document.getElementById('winMessage').textContent = message;
    document.getElementById('winModal').style.display = 'flex';

    // 取消选中状态
    if (gameState.selectedPiece) {
        gameState.selectedPiece.element.classList.remove('selected');
        gameState.selectedPiece = null;
    }
}

// 关闭胜利弹窗
function closeWinModal() {
    document.getElementById('winModal').style.display = 'none';
}

// 更新状态显示
function updateStatus() {
    const status = document.getElementById('status');

    if (gameState.currentTurn === 'red') {
        status.textContent = '红方回合（玩家）';
        status.className = 'status red-turn';
    } else {
        status.textContent = '黑方回合（AI）';
        status.className = 'status black-turn';
    }
}

// 计时器相关
function startTimer() {
    if (gameState.timer) clearInterval(gameState.timer);

    gameState.timeElapsed = 0;
    gameState.timer = setInterval(() => {
        gameState.timeElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeElapsed / 60).toString().padStart(2, '0');
    const seconds = (gameState.timeElapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

// 重置游戏
function resetGame() {
    // 重置游戏状态
    gameState.selectedPiece = null;
    gameState.currentTurn = 'red';
    gameState.moveHistory = [];
    gameState.aiThinking = false;
    gameState.gameOver = false;
    gameState.showHints = false;

    // 重置UI
    document.getElementById('thinking').style.display = 'none';
    document.getElementById('winModal').style.display = 'none';
    hideMoveHints();

    // 重新初始化棋盘和棋子
    initBoard();
    initPieces();

    // 更新状态和计时器
    updateStatus();
    stopTimer();
    startTimer();
}

// 悔棋功能
function undoMove() {
    if (gameState.moveHistory.length === 0 || gameState.aiThinking || gameState.gameOver) return;

    // 悔两步（玩家和AI各一步）
    const movesToUndo = gameState.currentTurn === 'red' ? 2 : 1;

    for (let i = 0; i < movesToUndo && gameState.moveHistory.length > 0; i++) {
        const lastMove = gameState.moveHistory.pop();

        // 恢复棋子位置
        const piece = gameState.pieces[lastMove.piece.id];
        if (piece) {
            piece.position = lastMove.from;
            updatePiecePosition(piece.element, lastMove.from);
        }

        // 恢复被吃掉的棋子
        if (lastMove.captured) {
            const capturedPiece = lastMove.captured;
            const pieceElement = createPieceElement(
                capturedPiece.id,
                capturedPiece.name,
                capturedPiece.color,
                capturedPiece.position
            );

            gameState.pieces[capturedPiece.id] = {
                id: capturedPiece.id,
                element: pieceElement,
                name: capturedPiece.name,
                color: capturedPiece.color,
                position: capturedPiece.position,
                originalPosition: capturedPiece.originalPosition
            };

            document.getElementById('board').appendChild(pieceElement);
        }
    }

    // 更新状态
    gameState.currentTurn = 'red';
    gameState.selectedPiece = null;
    hideMoveHints();
    updateStatus();

    // 重启计时器
    stopTimer();
    startTimer();
}