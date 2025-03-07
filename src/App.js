import { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import { FaCalendarAlt } from "react-icons/fa";

const ItemTypes = {
  CARD: "card",
  LIST: "list",
};

const App = () => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const savedBoard = localStorage.getItem("trelloBoard");
    if (savedBoard) setLists(JSON.parse(savedBoard));
  }, []);

  useEffect(() => {
    localStorage.setItem("trelloBoard", JSON.stringify(lists));
  }, [lists]);

  const addList = () => {
    const title = prompt("Enter a title for the list:");
    if (title) setLists([...lists, { id: uuidv4(), title, cards: [] }]);
  };

  const removeList = (listId) => {
    setLists(lists.filter((list) => list.id !== listId));
  };

  const addCard = (listId) => {
    const title = prompt("Enter card title:");
    if (title) {
      setLists(
        lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                cards: [
                  ...list.cards,
                  { id: uuidv4(), title, description: "", dueDate: "" },
                ],
              }
            : list
        )
      );
    }
  };

  const moveCard = (cardId, fromListId, toListId, toIndex) => {
    setLists((prevLists) => {
      let movedCard = null;
      const updatedLists = prevLists.map((list) => {
        if (list.id === fromListId) {
          movedCard = list.cards.find((card) => card.id === cardId);
          return {
            ...list,
            cards: list.cards.filter((card) => card.id !== cardId),
          };
        }
        return list;
      });

      return updatedLists.map((list) => {
        if (list.id === toListId && movedCard) {
          const updatedCards = [...list.cards];
          updatedCards.splice(toIndex, 0, movedCard);
          return { ...list, cards: updatedCards };
        }
        return list;
      });
    });
  };

  const removeCard = (listId, cardId) => {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? { ...list, cards: list.cards.filter((card) => card.id !== cardId) }
          : list
      )
    );
  };

  const moveList = (fromIndex, toIndex) => {
    const updatedLists = [...lists];
    const [movedList] = updatedLists.splice(fromIndex, 1);
    updatedLists.splice(toIndex, 0, movedList);
    setLists(updatedLists);
  };

  const updateListTitle = (listId, newTitle) => {
    setLists(
      lists.map((list) =>
        list.id === listId ? { ...list, title: newTitle } : list
      )
    );
  };
  const updateCard = (listId, cardId, updatedCardData) => {
    setLists(
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              cards: list.cards.map((card) =>
                card.id === cardId ? { ...card, ...updatedCardData } : card
              ),
            }
          : list
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="header">
          <h1 className="title">Trello Clone</h1>
          <button className="reset-button" onClick={() => setLists([])}>
            Clears all lists and cards
          </button>
        </header>
        <div className="board-container">
          <div className="board">
            {lists.map((list, index) => (
              <List
                key={list.id}
                list={list}
                index={index}
                moveList={moveList}
                removeList={removeList}
                addCard={addCard}
                moveCard={moveCard}
                updateCard={updateCard}
                removeCard={removeCard} 
                updateListTitle={updateListTitle}
              />
            ))}
            <button className="add-list" onClick={addList}>
              Add a new list
            </button>
          </div>
        </div>
        <footer className="footer">
          <p>Developed by Irfan Ali | Trello Clone Project</p>
        </footer>
      </div>
    </DndProvider>
  );
};

// List compnent

const List = ({
  list,
  index,
  moveList,
  removeList,
  addCard,
  moveCard,
  updateCard,
  removeCard,
  updateListTitle,
}) => {
  const listRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.LIST,
    item: { id: list.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.LIST,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveList(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const [, cardDrop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (draggedItem) => {
      if (draggedItem.fromListId !== list.id) {
        moveCard(
          draggedItem.id,
          draggedItem.fromListId,
          list.id,
          list.cards.length
        );
        draggedItem.fromListId = list.id;
      }
    },
  });

  drag(drop(cardDrop(listRef)));

  return (
    <div
      ref={listRef}
      className="list"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="list-header">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={() => {
              updateListTitle(list.id, editedTitle);
              setIsEditing(false);
            }}
            autoFocus
          />
        ) : (
          <h3 className="list-title" onClick={() => setIsEditing(true)}>
            {list.title}
          </h3>
        )}
        <button className="delete-list" onClick={() => removeList(list.id)}>
          X
        </button>
      </div>

      <div className="cards">
        {list.cards.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            listId={list.id}
            index={index}
            moveCard={moveCard}
            removeCard={removeCard}
            updateCard={updateCard}
          />
        ))}
      </div>
      <button className="add-card" onClick={() => addCard(list.id)}>
        {" "}
        Add new card
      </button>
    </div>
  );
};

// Card component

const Card = ({ card, listId, index, moveCard, removeCard, updateCard }) => {
  const cardRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedCard, setEditedCard] = useState({
    title: card.title,
    description: card.description || "",
    dueDate: card.dueDate || "",
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: { id: card.id, fromListId: listId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (draggedItem) => {
      if (draggedItem.index !== index && draggedItem.fromListId === listId) {
        moveCard(draggedItem.id, draggedItem.fromListId, listId, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(cardRef));

  const handleSave = () => {
    updateCard(listId, card.id, editedCard);
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        className="card"
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => setIsModalOpen(true)}
      >
        <p>{card.title}</p>
        {card.dueDate && (
          <div className="due-date">
            <FaCalendarAlt className="calendar-icon" />
            <span>{card.dueDate}</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Card</h2>
            <label>Edit the title</label>
            <input
              type="text"
              value={editedCard.title}
              onChange={(e) =>
                setEditedCard({ ...editedCard, title: e.target.value })
              }
            />

            <label>Description:</label>
            <textarea
              value={editedCard.description}
              onChange={(e) =>
                setEditedCard({ ...editedCard, description: e.target.value })
              }
            ></textarea>

            <label>Due Date:</label>
            <input
              type="date"
              value={editedCard.dueDate}
              onChange={(e) =>
                setEditedCard({ ...editedCard, dueDate: e.target.value })
              }
            />

            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)}>Close</button>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => {removeCard(listId, card.id); setIsModalOpen(false); }}> 🗑 Delete </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
