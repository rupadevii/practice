const getUUID = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(0, 8);

class Card{
    constructor({
        id = getUUID(),
        content = "New Card",
        description = "",
        due = "",
        labels = [],
        archived = false
    }){
        this.id = id;
        this.content = content;
        this.description = description;
        this.due = due;
        this.labels = labels;
        this.archived = archived;
    }
}

class List{
    constructor({id = getUUID(), title="New List", cards = []}){
        this.id = id;
        this.title = title;
        this.cards = cards.map((c) => new Card(c));
    }
}

class Board{
    constructor({id = getUUID(), title = "New Board", lists = []}){
        this.id = id;
        this.title = title;
        this.lists = lists.map((l) => new List(l))
    }
}

class StateManager{
    constructor(storageKey = "mini_trello_clone_v1"){
        this.storageKey = storageKey;
        this.boards = this.loadInitialData();
    }

    loadInitialData(){
        try{
            const raw = localStorage.getItem(this.storageKey);
            if(!raw){
                return [
                    new Board({
                        title: "Dummy Board", lists: [
                            new List({
                                title: "Todo - dummy list", cards: [
                                    new Card({
                                        content: "dummy task-1"
                                    })
                                ],
                            }),
                        ],
                    }),
                ]
            }

            const parsed = JSON.parse(raw);
            return parsed.map((b) => new Board(b));
            
        } catch(error){
            return []
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.boards));
        document.dispatchEvent(new CustomEvent("stateChanged"))
    }

    getBoards(){
        return this.boards;
    }

    addBoard(title){
        this.boards.push(new Board({title}));
        this.save();
    }

    addList(boardId, title){
        const board = this.boards.find((b) => b.id === boardId);

        if (!board) return;

        board.lists.push(new List({ title }));
        this.save();     
    }

    removeBoard(boardId){
        this.boards = this.boards.filter((b) => b.id !== boardId);
        this.save();
    }

    removeList(boardId, listId){
        const board = this.boards.find((b) => b.id === boardId);
        if (!board) return;

        board.lists = board.lists.filter((l) => l.id !== listId);
        this.save();
    }

    _findList(boardId, listId) {
        const b = this.boards.find((x) => x.id === boardId);
        if (!b) return;
        return b.lists.find((l) => l.id === listId);
    }

    addCard(boardId, listId, content) {
        const list = this._findList(boardId, listId);
        if (!list) return;
        list.cards.push(new Card({ content }));
        this.save();
    }

    removeCard(boardId, listId, cardId) {
        const list = this._findList(boardId, listId);
        if (!list) return;
        list.cards = list.cards.filter((c) => c.id !== cardId);
        this.save();
    }

    addCardDetails(boardId, listId, cardId){
        const list = this._findList(boardId, listId);
        if (!list) return;
        const currentCard = list.cards.find((c) => c.id === cardId);
    }
}

const state = new StateManager();

const boardsContainer = document.getElementById("boardsContainer");

function createBoardNode(board){
    const wrapper = document.createElement("div");
    wrapper.className = "bg-zinc-900 text-white p-4 border border-stone-700 rounded-xl flex shadow flex-col gap-3 w-full";

    wrapper.innerHTML = `
    <div data-board-id="${board.id}">
        <div class="flex items-start gap-3 px-5 items-center">
            <h3 class="flex-1 text-xl">${board.title}</h3>
            <button data-action = "add-list" class="rounded-full px-2 py-1 hover:bg-zinc-700 border border-white hover:border-black"><i class="fa-solid fa-plus"></i></button>
            <button data-action = "delete-board" class="rounded-full px-2 py-1 hover:bg-zinc-700 border border-white hover:border-black"><i class="fa fa-trash"></i></button>
        </div>
        <div data-board-id = "${board.id}" class = "board lists flex-wrap lg:flex-nowrap flex items-start gap-4 m-2"></div>
    </div>
    `
    return wrapper;
}

function createListNode(boardId, list){
    const liWrapper = document.createElement("div");
    liWrapper.className = "list bg-zinc-800 mt-1 py-3 px-4 rounded-md flex flex-col gap-2 w-[400px] lg:w-[300px] lg:shrink-0";
    liWrapper.dataset.listId = list.id;

    const cardsHTML = list.cards.map((c) => createCardNode(c)).join("");

    liWrapper.innerHTML = `
    <div>
        <div class="flex justify-between items-center ml-2">
            <h3 class="text-lg">${list.title}</h3>
            <div>
                <button data-action="add-card" data-list-id="${list.id}" data-board-id="${boardId}" class="rounded-full px-2 py-1 hover:bg-zinc-900"><i class="fa-solid fa-plus"></i></button>
                <button data-action="delete-list" data-list-id="${list.id}" data-board-id="${boardId}" class="rounded-full px-3 py-2 hover:bg-zinc-900"><i class="fa fa-trash"></i></button>
            </div>
        </div>

        <div data-list-id="${list.id}"  data-list-container class="lists flex flex-col gap-3 mt-2">
            ${cardsHTML}
        </div>
    </div>
    `;

    return liWrapper;
}

function createCardNode(card){
    return `
        <div data-card-id="${card.id}" class="card bg-zinc-900 border-b border-s border-gray-600 px-4 py-3 rounded flex items-center hover:bg-zinc-700 hover:cursor-pointer" draggable=true>
            <h3 class="flex-1">${card.content}</h3>
            <div>
                <button data-action="card-details" class="rounded-full px-2 py-1 hover:bg-zinc-900"><i class="fas fa-ellipsis-v"></i></button>
                <button data-action="delete-card" class="rounded-full px-2 py-1 hover:bg-zinc-900"><i class="fa fa-trash"></i></button>
            </div>
        </div>
        `
}

function renderElements(filterKey){
    boardsContainer.innerHTML = "";

    const boards = state.getBoards();

    if (!boards.length) {
        boardsContainer.innerHTML = `
            <div class="text-center text-gray-70"> No boards yet, click that New Board button to create one!! </div>
        `;
    }

    boards.forEach(board => {
        const boardNode = createBoardNode(board);
        const listContainer = boardNode.querySelector(".lists");

        board.lists.forEach((list) => {
            const copy = new List({ ...list });

            if (filterKey) {
                const q = filterKey.toLowerCase();

                copy.cards = copy.cards.filter((c) =>
                (c.content && c.content?.toLowerCase()?.includes(q)) ||
                (c.description && c.description?.toLowerCase()?.includes(q))
                );
            }

            const listNode = createListNode(board.id, copy);

            listContainer.appendChild(listNode);
        })

        boardsContainer.appendChild(boardNode);
    });

}

renderElements()

document.addEventListener("stateChanged", () => {
    renderElements(searchInput.value.trim());
    document.title = `Mini Trello - Saved ${new Date().toLocaleTimeString()}`;
})

const addBoardBtn = document.querySelector("#addBoardBtn")
const searchInput = document.querySelector("#searchInput");

searchInput.addEventListener("change", (e) => {
    const value = e.target.value.trim();
    renderElements(value);
});

const boardModalContainer = document.getElementById("board-modal-container");
const boardForm = document.forms.boardform

addBoardBtn.addEventListener("click", () => {
    boardModalContainer.classList.remove("hidden");
})

boardForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const title = document.getElementById("boardName").value.trim();
    if(!title) return;
    state.addBoard(title);

    boardModalContainer.classList.add("hidden");
    boardForm.reset()
})

boardsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");

    if(!btn) return;

    const action = btn.dataset.action;
    
    if(!action) return;
    const boardId = btn.parentElement.parentElement.dataset.boardId;
    
    if(action === "add-list"){
        console.log(boardId)
        const title = prompt("Enter your list title" + boardId, "New List");
        if (!title) return;

        state.addList(boardId, title);
    }

    if(action === "delete-board"){
        const consent = confirm("Are you sure on deleting this board?");

        if(consent && boardId){
            state.removeBoard(boardId);
        }
    }

    if(action === "delete-list"){
        const consent = confirm("Are you sure on deleting this list?");
        const { boardId, listId } = btn.dataset;

        if (consent && boardId && listId) {
        state.removeList(boardId, listId);
        }
    }

    if (action === "add-card") {
        const { boardId, listId } = btn.dataset;
        const content = prompt("Enter your card title", "New Card");
        if (!content) return;

        state.addCard(boardId, listId, content);
    }

    if (action === "delete-card") {
        const cardEl = e.target.closest("[data-card-id]");

        if (!cardEl) return;

        const cardId = cardEl.dataset.cardId;
        const loc = findCardLocation(cardId);

        if (!loc || !cardId) return;

        const consent = confirm("Are you sure on deleting this card?");
        if (!consent) return;

        state.removeCard(loc.boardId, loc.listId, cardId);
    }

    if (action === "card-details"){
        e.stopPropagation()
        showModal()
    }

})

document.addEventListener("keydown", (e) => {
    if (e.key === "n" && e.metaKey) {
        e.preventDefault();
        addBoardBtn.click();
    }
});

function findCardLocation(cardId) {
    for (const b of state.getBoards()) {
        for (const l of b.lists) {
            if (l.cards.some((c) => c.id === cardId)){
                return {
                    boardId: b.id,
                    listId: l.id,
                };
            }
        }
    }
    return null;
}

//modal event listeners
const modal = document.getElementById("modal")
const container = document.getElementById("container")
const saveBtn = document.getElementById("modelSave")

function showModal(){
    modal.classList.remove("hidden")
}

function hideModal(){
    modal.classList.add("hidden")
}

document.addEventListener("click", (e) => {
    hideModal()
})

container.addEventListener("click", (e) => {
    showModal()
    e.stopPropagation()
})

//dnd

let draggedItem = null;
let draggedFrom = null;

boardsContainer.addEventListener("dragstart", (e) => {
    if(e.target.closest(".card")){
        draggedItem = e.target;
        draggedFrom = findCardLocation(draggedItem.dataset.cardId);
        draggedItem.classList.add('card-dragging')
    }
})

boardsContainer.addEventListener("dragend", (e) => {
    if(e.target.closest(".card")){
        draggedFrom = null;
        draggedItem = null;
        e.target.classList.remove("card-dragging")
    }
})

boardsContainer.addEventListener("dragover", (e) => {
    if(e.target.closest(".list")){
        e.preventDefault()
        e.target.closest(".list").classList.add('drag-over')
    }
})

boardsContainer.addEventListener("dragenter", (e) => {
    if(e.target.matches(".list")){
        e.preventDefault()
        e.target.classList.add('drag-over')
    }
})

boardsContainer.addEventListener('dragleave', (e) => {
    e.preventDefault()
    if(e.target.closest(".list")){
       e.target.closest(".list").classList.remove("drag-over")
    }
})

boardsContainer.addEventListener('drop', (e) => {
    if(e.target.closest(".list")){
        const currTarget = e.target.closest(".list")
        currTarget.classList.remove('drag-over')
        const boardId = e.target.closest("[data-board-id]").dataset.boardId
        const listId = e.target.closest("[data-list-id]").dataset.listId;
        if(draggedItem){
            const cardContent = draggedItem.textContent
            currTarget.children[0].children[1].appendChild(draggedItem);
            state.addCard(boardId, listId, cardContent)
            state.removeCard(draggedFrom.boardId, draggedFrom.listId, draggedItem.dataset.cardId)
        }
    }
})