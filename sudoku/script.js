import puzzles from './puzzles.js'
const container = document.querySelector(".container");
const gameStatus = document.getElementById("game-status");
const buttons = document.querySelectorAll("button");
const seconds = document.getElementById("sec");
const minutes = document.getElementById("min");

let currPuzzle = puzzles[0];

function renderPuzzle(puzzle, level){
    setLevel(level);
    container.innerHTML = "";

    for(let i=0; i<puzzle.length; i++){
        for(let j=0; j<puzzle[i].length; j++){
            const box = document.createElement("div");
            box.className = "cell"
            box.dataset.row = i;
            box.dataset.col = j;
            if(j===2 || j===5) box.classList.add("row-end")
            if(i===2 || i===5) box.classList.add("row-bottom")
            if(puzzle[i][j] === 0){
                box.textContent = ""
            }else{
                box.textContent = puzzle[i][j]
                box.classList.add("fixed")
            }
            container.append(box)
        }

    }
}

let interval;

buttons.forEach(button => {
    button.addEventListener("click", (e) => {
        buttons.forEach(button => button.classList.remove("active"))
        e.target.classList.add("active");
        currPuzzle = puzzles.find(item => item.level === e.target.dataset.level);
        renderPuzzle(currPuzzle.puzzle, currPuzzle.level);
        seconds.textContent = "00";
        minutes.textContent = "00"
        setTimer()
    })
})

function setTimer(){
    clearInterval(interval)
    
    interval = setInterval(() => {
        let currSec = Number(seconds.textContent);
        let currMin = Number(minutes.textContent);
        currSec++;
        seconds.textContent = currSec < 10 ? `0${currSec}` : currSec;
        if(currSec % 60 === 0){
            currMin++;
            seconds.textContent = "00"
            minutes.textContent = currMin < 10 ? `0${currMin}` : currMin;
        }
    }, 1000)

}

let selectedCell = null;
container.addEventListener("click", handleClick);

    function handleClick(e){
    const cells = document.querySelectorAll(".cell");

    selectedCell = e.target
    cells.forEach(cell => {
        cell.style.backgroundColor = `${cell === e.target ? "rgb(193, 190, 190)": "white"}`
    })
}

document.addEventListener("keydown", handleKeyDown);

function handleKeyDown(e){
    const puzzle = currPuzzle.puzzle
    const row = selectedCell.dataset.row;
    const col = selectedCell.dataset.col;

    if(selectedCell && !selectedCell.classList.contains("fixed")){
        if(e.key>0 && e.key<=9){
            selectedCell.textContent = e.key;
            selectedCell.style.color = isValid(row, col, Number(e.key)) ? "blue" : "red";
            puzzle[row][col] = Number(e.key)
        }
        if(e.key === "Backspace"){
            selectedCell.textContent = "";
            puzzle[row][col] = 0;
        }
    }
    
    solvedStatus()
}

function setLevel(level){
    const currLevel = document.querySelector(`[data-level=${level}]`)
    currLevel.classList.add("active")
}

function isValid(row, col, value){
    const puzzle = currPuzzle.puzzle;

    for(let i=0; i<puzzle.length; i++){
        if(puzzle[row][i] === value) return false
    }

    for(let i=0; i<puzzle.length; i++){
        if(puzzle[i][col] === value) return false
    }

    let startRow = row - row % 3;
    let startCol = col - col % 3;
    
    for(let i=startRow; i<startRow+3; i++){
        for(let j=startCol; j<startCol+3; j++){
            if(puzzle[i][j] === value) return false
        }
    }
    return true
}

function solvedStatus(){
    const puzzle = currPuzzle.puzzle
    if(!puzzle.some(i => i.includes(0))){
        gameStatus.textContent = "🎉 Congratulations!";
        
        container.removeEventListener("click", handleClick)
        document.removeEventListener("keydown", handleKeyDown)
        clearInterval(interval)

    }
}

renderPuzzle(currPuzzle.puzzle, currPuzzle.level);
setTimer()
