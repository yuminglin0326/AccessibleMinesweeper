let boardRow = 0;
let boardCol = 0;
let mineCount = 0;
let shiftMode = 0; // 0: number of unknown cells and flagged cells, 1: location
const synth = window.speechSynthesis;
$(document).ready(function() {
    
    $("#easy-button").click(function() {
        $("#board").empty();
        boardRow = 6;
        boardCol = 6;
        mineCount = 5;
        createBoard(boardRow, boardCol, mineCount);
    });

    $("#medium-button").click(function() {
        $("#board").empty();
        boardRow = 9;
        boardCol = 9;
        mineCount = 10;
        createBoard(boardRow, boardCol, mineCount);
    });

    $("#hard-button").click(function() {
        $("#board").empty();
        boardRow = 16;
        boardCol = 16;
        mineCount = 40;
        createBoard(boardRow, boardCol, mineCount);
    });

    // Function to speak the focused element
    function speakFocusedElement(focusedElement) {
        // reset the speech
        let elementText = getSpeechText(focusedElement);
        // console.log("speaking", focusedElement)

        let utterance = new SpeechSynthesisUtterance();
        utterance.text = elementText;
        synth.speak(utterance);
    }

    // Function to get the text content of the focused element
    function getSpeechText(focusedElement) {
        let elementText = "";

        if ($(focusedElement).is($("#board"))) { // when speaking the board
            elementText = "Board";
        } 
        else if ($(focusedElement).is($(".cell"))) { // when speaking the cells
            if (focusedElement.classList.contains("revealed")) { // if it's a known cell
                let val = parseInt(focusedElement.getAttribute("value"));

                if (val == 9) { // if it's a mine
                    elementText = "mine";
                }
                else { 
                    // elementText = "Cell value" + val + ", at " + row + ", " + col;
                    elementText = "value" + val + ",";
                }
            } 
            else if(focusedElement.classList.contains("flagged")) { // if it's a flagged cell
                if (focusedElement.classList.contains("wrong-flag") && gameEnd) {
                    elementText = "wrong flagged Cell";
                } else {
                    elementText = "flagged Cell";
                }
            } else {
                elementText = "unknown Cell";
            }
            
            // if the cell is on the edge of the board
            let row = parseInt(focusedElement.getAttribute("row"));
            let col = parseInt(focusedElement.getAttribute("col"));
            if (row == 1 && col == 1) {
                elementText += " at top left corner";
            } else if (row == 1 && col == boardCol) {
                elementText += " at top right corner";
            } else if (row == boardRow && col == 1) {
                elementText += " at bottom left corner";
            } else if (row == boardRow && col == boardCol) {
                elementText += " at bottom right corner";
            } else if (row == 1) {
                elementText += " at top edge";
            } else if (row == boardRow) {
                elementText += " at bottom edge";
            } else if (col == 1) {
                elementText += " at left edge";
            } else if (col == boardCol) {
                elementText += " at right edge";
            }

        } 
        else { // when speaking other elements that are not on the board
            elementText = focusedElement.textContent.trim();
        }

        return elementText;
    }

    // when press shift, speak the details of a cell
    $(document).keydown(function(e) {
        let focusedElement = document.activeElement;
        if (e.shiftKey && $(focusedElement).is($(".cell"))) {
            console.log("Shift + Space pressed");
            console.log("Focused element", focusedElement)
            let row = parseInt(focusedElement.getAttribute("row"));
            let col = parseInt(focusedElement.getAttribute("col"));
            let val = parseInt(focusedElement.getAttribute("value"));
            let elementText = "";

            if (shiftMode == 0) {
                if (val == 9 && focusedElement.classList.contains("revealed")) {
                    elementText = "it's a mine";
                } else if (val == 0 && focusedElement.classList.contains("revealed")) {
                    elementText = "no mines around";
                } else if (focusedElement.classList.contains("wrong-flag") && gameEnd) {
                    elementText = "wrong flagged cell";
                } else if (focusedElement.classList.contains("flagged")) {
                    elementText = "flagged cell";
                } else if (!focusedElement.classList.contains("revealed")) {
                    elementText = "unknown";
                } else {
                    let checkResult = checkNeighbors(row, col);
                    let unknownCount = checkResult[0];
                    let flagCount = checkResult[1];
                    let directions = checkResult[2];
                    
                    if (flagCount > 0) {
                        elementText = flagCount + " flagged neighbors and ";
                    } 
    
                    elementText += unknownCount + " unknown";
                    if (unknownCount != 0) {
                        elementText += " at";
                    }
                    for (let i = 0; i < directions.length; i++) {
                        elementText += directions[i] + ", ";
                    }
                }
                shiftMode = 1;
            } else if (shiftMode == 1) {
                elementText = "row " + row + ", column " + col;
                shiftMode = 0;
            }
            

            let utterance = new SpeechSynthesisUtterance();
            utterance.text = elementText;
            console.log("Speaking", elementText)
            speechSynthesis.speak(utterance);

        }
    });

    // Speak the focused element when focus changes
    $(document).on('focus', '[tabindex], button', function(e) {
        // Speak the focused element when focus changes
        let focusedElement = e.target;
        speakFocusedElement(focusedElement);
        e.stopPropagation();
    });

    // Speak the cell when focus on cell changes
    $('#board').on('keydown', '.cell', function(event) {
        let currentCell = $(this);
        let currentRow = parseInt(currentCell.attr('row'));
        let currentCol = parseInt(currentCell.attr('col'));

        // Handle arrow key presses
        switch(event.key) {
            case 'ArrowUp':
                moveFocus(currentRow - 1, currentCol);
                break;
            case 'ArrowDown':
                moveFocus(currentRow + 1, currentCol);
                break;
            case 'ArrowLeft':
                moveFocus(currentRow, currentCol - 1);
                break;
            case 'ArrowRight':
                moveFocus(currentRow, currentCol + 1);
                break;
            default:
                return; // Do nothing for other keys
        }

        // Prevent default behavior of arrow keys (e.g., scrolling)
        event.preventDefault();
    });

    // Function to move focus to a cell with the specified row and column
    function moveFocus(row, col) {
        shiftMode = 0;
        // Find the cell with the specified row and column
        if (row < 1 || col < 1 || row > boardRow || col > boardCol) {
            console.log("out of bounds");
            $(".white").attr("tabindex", 0);
            $(".white").focus();
        }
        let nextCell = $('#board .cell[row="' + row + '"][col="' + col + '"]');
        
        // Check if the cell exists
        if (nextCell.length > 0) {
            // Set focus to the next cell
            nextCell.focus();
        }
    }

    // Handle spacebar imitating click event
    $(document).on('keydown', function(event) {
        // Check if the spacebar is pressed (key code 32)
        if (event.which === 32) {
            console.log("Spacebar pressed")
            // Trigger a click event on the currently focused element
            focusedElement = document.activeElement;
            // check if the focused element is mine
            $(document.activeElement).click();
            if (!$(focusedElement).hasClass("mine")){
                elementText = "clicked"
                let utterance = new SpeechSynthesisUtterance();
                utterance.text = elementText;
                speechSynthesis.speak(utterance);
                focusedElement = document.activeElement;
                speakFocusedElement(focusedElement);
            }
            
        }
    });
    
    let cellId = 1;
    let mineCells = [];
    let labeledCount = 0;
    let gameEnd = false;
    // let isFlagMode = false;
    
    // function to create the board
    function createBoard(boardRow, boardCol, mineCount) {
        // reset variables
        gameEnd = false;
        labeledCount = 0;
        cellId = 1;
        mineCells = [];
        isFlagMode = false;
        $("#game-result").html("").removeAttr("tabindex");
        $(".white").attr("tabindex", -1);
        
        // create frame of the board
        $("#board").css({
            "grid-template-columns": "repeat(" + boardCol + ", 40px)",
            "grid-template-rows": "repeat(" + boardRow + ", 40px)"
        });
        $("#mines").removeClass("hidden");
        $("#board").attr("tabindex", 0);

        // create plain board
        for (let i = 0; i < boardRow; i++) {
            for (let j = 0; j < boardCol; j++) {
                let cell = $("<div>").addClass("cell").attr("id", cellId).attr("row", i+1).attr("col", j+1).attr("value", 0).attr("tabindex", 0);
                // cell.html(cell.attr("value"));
                // cell.html(cellId);
                // cell.html(i + ", " + j);

                $("#board").append(cell);
                cellId++;
            }
        }

        // add mines
        // 10 mines for 9x9 board
        // 40 mines for 16x16 board
        // 99 mines for 16x30 board
        totalCells = boardRow * boardCol;
        addMines(mineCount, totalCells);

        labelAroundMines();

        // add click event
        $(".cell").click(function() {
            if (gameEnd) {
                return;
            }
            let row = parseInt($(this).attr("row"));
            let col = parseInt($(this).attr("col"));
            // console.log("Clicked on: " + row + ", " + col);
            if ($(this).hasClass("flagged")) {
                return;
            } else {
                reveal(row, col, boardRow, boardCol);
            }

            checkWin(totalCells);
        });



        for (let i = 1; i < totalCells+1; i++) {
            let cell = $("#" + i);
            if (cell.hasClass("revealed")){
                cell.html(cell.attr("value"))
            }
        
        }
        
        
    }

    // enter key to flag cell
    $(document).keydown(function(e) {
        if (e.which == 13) {
            console.log("Enter key pressed");
            if (gameEnd) {
                return
            }
            focusCell = $(document.activeElement);
            let row = parseInt(focusCell.attr("row"));
            let col = parseInt(focusCell.attr("col"));
            // console.log("Flagged: " + row + ", " + col);
            let flagImage = $("<img alt='flag'>").attr("src", "flag.png").attr("width", "100%").attr("height", "auto");
            if (focusCell.hasClass("flagged")) {
                focusCell.html("");
                focusCell.removeClass("flagged");
                if (focusCell.hasClass("wrong-flag")) {
                    focusCell.removeClass("wrong-flag");
                }
                labeledCount--;
                mineCount++;
                $("#mines").html("Mines left: " + mineCount);

                // speak the flag
                elementText = "remove flag, " + mineCount + " mines left";
                let utterance = new SpeechSynthesisUtterance();
                utterance.text = elementText;
                speechSynthesis.speak(utterance);
            } else if (!focusCell.hasClass("revealed") && !gameEnd){
                focusCell.html(flagImage);
                focusCell.addClass("flagged");
                if (!focusCell.hasClass("mine")) {
                    focusCell.addClass("wrong-flag");
                }
                labeledCount++;
                mineCount--;
                $("#mines").html("Mines left: " + mineCount);

                // speak the flag
                elementText = "add flag, " + mineCount + " mines left";
                let utterance = new SpeechSynthesisUtterance();
                utterance.text = elementText;
                speechSynthesis.speak(utterance);
            }

            checkWin(totalCells);
        }
    });

    // add mines to the board
    function addMines(mineCount, totalCells) {
        // console.log("Adding mines...");
        // console.log("Total cells: " + totalCells);
        while (mineCells.length < mineCount) {
            let randomCell = Math.floor(Math.random() * totalCells) + 1;
            if (!mineCells.includes(randomCell)) {
                mineCells.push(randomCell);
                $("#" + randomCell).addClass("mine").attr("value", 9);
            }
        }

        // display the total number of mines
        $("#mines").html("Mines left: " + mineCount);
    }

    // label the cells around the mines
    function labelAroundMines() {
        for (let m in mineCells) {
            mine = $("#" + mineCells[m]);
            let row = parseInt(mine.attr("row"));
            let col = parseInt(mine.attr("col"));
            // console.log("Mine at: " + row + ", " + col);

            // top left, top, top right, left, right, bottom left, bottom, bottom right
            neighborCells = [[row - 1, col - 1], [row - 1, col], [row - 1, col + 1], [row, col - 1], [row, col + 1], [row + 1, col - 1], [row + 1, col], [row + 1, col + 1]];

            for (let n in neighborCells) {
                neighbor = neighborCells[n];
                neighborCell = $('.cell[row="' + neighbor[0] + '"][col="' + neighbor[1] + '"]');
                if (!neighborCell.hasClass("mine")) {
                    neighborCell.attr("value", parseInt(neighborCell.attr("value")) + 1);
                }
            }

            
        }
    }

    //
    function reveal(row, col, boardRow, boardCol) {
        let cell = $('.cell[row="' + row + '"][col="' + col + '"]');
        if (row < 1 || row > boardRow || col < 1 || col > boardCol || cell.hasClass("revealed") || cell.hasClass("flagged")) {
            // console.log("Invalid cell" + 'labelCount: ' + labeledCount + ' totalCells: ' + totalCells)
            // console.log("row: " + row + "boardRow: " + boardRow + " col: " + col + " boardCol: " + boardCol);
            return;
        }

        cell.addClass("revealed");
        labeledCount++;
        // console.log("Revealed: " + row + ", " + col);
        if (cell.hasClass("mine")) {
            mineImgClicked = $("<img alt='mine got clicked on'>").attr("src", "mine-clicked.png").attr("width", "100%").attr("height", "auto");
            cell.html(mineImgClicked);

            // speak the mine
            let utterance = new SpeechSynthesisUtterance();
            utterance.text = "Boom! Clicked on a mine! Game over!";
            speechSynthesis.speak(utterance);

            clickMine();

            return;
        } else if (cell.attr("value") == 0) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    reveal(row + dx, col + dy, boardRow, boardCol);
                }
            }
        }

        totalCells = boardRow * boardCol;
        for (let i = 1; i < totalCells+1; i++) {
            let cell = $("#" + i);
            // cell.html(cell.attr("value"));
            if (cell.hasClass("revealed")){
                if (cell.attr("value") == 0){
                    cell.html("")
                } else if (cell.attr("value") != 9){
                    cell.html(cell.attr("value"))
                }
            }
        
        }
    }


    // check if the player wins
    function checkWin(totalCells) {
        // console.log('labeledCount: ' + labeledCount + ' totalCells: ' + totalCells);
        if (labeledCount == totalCells) {
            gameEnd = true;
            $("#game-result").html("You win!").attr("tabindex", 0);
            let utterance = new SpeechSynthesisUtterance();
            utterance.text = "You win!";
            speechSynthesis.speak(utterance);
        }
    }


    // click on a mine
    function clickMine() {
        // alert("Game over!");
        // display all mines
        gameEnd = true;
        $("#game-result").html("Game over!").attr("tabindex", 0);
        for (let m in mineCells) {
            mine = $("#" + mineCells[m]);
            mineImg = $("<img alt='mine unclicked'>").attr("src", "mine.png").attr("width", "100%").attr("height", "auto");
            if (mine.html() == "") {
                mine.html(mineImg);
            }
            mine.addClass("revealed");
        }
        wrongFlagImg = $("<img alt='wrong flag'>").attr("src", "wrong-flag.png").attr("width", "100%").attr("height", "auto");
        $(".wrong-flag").html(wrongFlagImg);
    }


    // check the number of revealed cells around a cell
    function checkNeighbors(row, col) {
        let unknownCount = 0;
        directions = []
        let flagCount = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let cell = $('.cell[row="' + (row + dx) + '"][col="' + (col + dy) + '"]');
                if (row + dx < 1 || row + dx > boardRow || col + dy < 1 || col + dy > boardCol) {
                    continue;
                }

                if (cell.hasClass("flagged")) {
                    flagCount++;
                } else if (!cell.hasClass("revealed")) {
                    unknownCount++;
                    if (dx == -1 && dy == -1) {
                        directions.push("Top left");
                    } else if (dx == -1 && dy == 0) {
                        directions.push("Top");
                    } else if (dx == -1 && dy == 1) {
                        directions.push("Top right");
                    } else if (dx == 0 && dy == -1) {
                        directions.push("Left");
                    } else if (dx == 0 && dy == 1) {
                        directions.push("Right");
                    } else if (dx == 1 && dy == -1) {
                        directions.push("Bottom left");
                    } else if (dx == 1 && dy == 0) {
                        directions.push("Bottom");
                    } else if (dx == 1 && dy == 1) {
                        directions.push("Bottom right");
                    }
                }
            }
        }
        console.log("Unknown: " + unknownCount + ", Flagged: " + flagCount);
        return [unknownCount, flagCount, directions];
    }
});

