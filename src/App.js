
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
    const title = prompt("Enter list title:");
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
            ? { ...list, cards: [...list.cards, { id: uuidv4(), title, description: "", dueDate: "" }] }
            : list
        )
      );
    }
  };

  const moveCard = (cardId, fromListId, toListId) => {
    let cardToMove;
    const updatedLists = lists.map((list) => {
      if (list.id === fromListId) {
        cardToMove = list.cards.find((card) => card.id === cardId);
        return { ...list, cards: list.cards.filter((card) => card.id !== cardId) };
      }
      return list;
    });

    if (cardToMove) {
      setLists(
        updatedLists.map((list) =>
          list.id === toListId ? { ...list, cards: [...list.cards, cardToMove] } : list
        )
      );
    }
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
          <button className="reset-button" onClick={() => setLists([])}>Reset Board</button>
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
                updateListTitle={updateListTitle} 
              />
            ))}
            <button className="add-list" onClick={addList}>+ Add another list</button>
          </div>
        </div>
        <footer className="footer">
          <p>Developed by Irfan Ali | Trello Clone Project</p>
        </footer>
      </div>
    </DndProvider>
  );
};

const List = ({ list, index, moveList, removeList, addCard, moveCard, updateCard, updateListTitle }) => {
  const listRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => {
      if (item.fromListId !== list.id) {
        moveCard(item.id, item.fromListId, list.id);
      }
    },
  });

  drop(listRef);

  const handleTitleChange = (e) => setEditedTitle(e.target.value);

  const handleTitleBlur = () => {
    if (editedTitle.trim() === "") {
      setEditedTitle(list.title);
    } else {
      updateListTitle(list.id, editedTitle);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    }
  };

  return (
    <div ref={listRef} className="list">
      <div className="list-header">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          <h3 className="list-title" onClick={() => setIsEditing(true)}>
            {list.title}
          </h3>
        )}
        <button className="delete-list" onClick={() => removeList(list.id)}>X</button>
      </div>
      <div className="cards">
        {list.cards.map((card) => (
          <Card key={card.id} card={card} listId={list.id} moveCard={moveCard} updateCard={updateCard} />
        ))}
      </div>
      <button className="add-card" onClick={() => addCard(list.id)}>+ Add a card</button>
    </div>
  );
};

const Card = ({ card, listId, moveCard, updateCard }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: { id: card.id, fromListId: listId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedCard, setEditedCard] = useState({
    title: card.title,
    description: card.description || "",
    dueDate: card.dueDate || "",
  });

  const handleSave = () => {
    updateCard(listId, card.id, editedCard);
    setIsModalOpen(false);
  };

  

  return (
    <>
      <div ref={drag} className="card" style={{ opacity: isDragging ? 0.5 : 1 }} onClick={() => setIsModalOpen(true)}>
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
            <label>Title:</label>
            <input type="text" value={editedCard.title} onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })} />

            <label>Description:</label>
            <textarea value={editedCard.description} onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}></textarea>

            <label>Due Date:</label>
            <input type="date" value={editedCard.dueDate} onChange={(e) => setEditedCard({ ...editedCard, dueDate: e.target.value })} />

            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)}>Close</button>
              <button onClick={handleSave}>Save</button>
              {/* <button onClick={handleDelete}>delete</button> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;



// import { useState, useEffect, useRef } from "react";
// import { DndProvider, useDrag, useDrop } from "react-dnd";
// import { HTML5Backend } from "react-dnd-html5-backend";
// import { v4 as uuidv4 } from "uuid";
// import "./App.css";
// import { FaCalendarAlt } from "react-icons/fa";


// const ItemTypes = {
//   CARD: "card",
//   LIST: "list",
// };

// const App = () => {
//   const [lists, setLists] = useState([]);

//   useEffect(() => {
//     const savedBoard = localStorage.getItem("trelloBoard");
//     if (savedBoard) setLists(JSON.parse(savedBoard));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("trelloBoard", JSON.stringify(lists));
//   }, [lists]);

//   const addList = () => {
//     const title = prompt("Enter list title:");
//     if (title) setLists([...lists, { id: uuidv4(), title, cards: [] }]);
//   };

//   const removeList = (listId) => {
//     setLists(lists.filter((list) => list.id !== listId));
//   };

//   const addCard = (listId) => {
//     const title = prompt("Enter card title:");
//     if (title) {
//       setLists(
//         lists.map((list) =>
//           list.id === listId
//             ? { ...list, cards: [...list.cards, { id: uuidv4(), title, description: "", dueDate: "" }] }
//             : list
//         )
//       );
//     }
//   };


//   const moveCard = (cardId, fromListId, toListId) => {
//     let cardToMove;
//     const updatedLists = lists.map((list) => {
//       if (list.id === fromListId) {
//         cardToMove = list.cards.find((card) => card.id === cardId);
//         return { ...list, cards: list.cards.filter((card) => card.id !== cardId) };
//       }
//       return list;
//     });
  
//     if (cardToMove) {
//       setLists(
//         updatedLists.map((list) =>
//           list.id === toListId ? { ...list, cards: [...list.cards, cardToMove] } : list
//         )
//       );
//     }
//   };
  
//   const moveList = (fromIndex, toIndex) => {
//     const updatedLists = [...lists];
//     const [movedList] = updatedLists.splice(fromIndex, 1);
//     updatedLists.splice(toIndex, 0, movedList);
//     setLists(updatedLists);
//   };

//   const updateCard = (listId, cardId, updatedData) => {
//     setLists(
//       lists.map((list) =>
//         list.id === listId
//           ? {
//               ...list,
//               cards: list.cards.map((card) =>
//                 card.id === cardId ? { ...card, ...updatedData } : card
//               ),
//             }
//           : list
//       )
//     );
//   };

//   return (
//     <DndProvider backend={HTML5Backend}>
//       <div className="app">
//         <header className="header">
//           <h1 className="title">Trello Clone</h1>
//           <button className="reset-button" onClick={() => setLists([])}>Reset Board</button>
//         </header>
//         <div className="board-container">
//           <div className="board">
//             {lists.map((list, index) => (
//               <List key={list.id} list={list} index={index} moveList={moveList} removeList={removeList} addCard={addCard} moveCard={moveCard} updateCard={updateCard} />
//             ))}
//             <button className="add-list" onClick={addList}>+ Add another list</button>
//           </div>
//         </div>
//         <footer className="footer">
//           <p>Developed by Irfan Ali | Trello Clone Project</p>
//         </footer>
//       </div>
//     </DndProvider>
//   );
// };

// const useDragDropList = (index, moveList) => {
//   const ref = useRef(null);

//   const [, drop] = useDrop({
//     accept: ItemTypes.LIST,
//     hover: (draggedItem) => {
//       if (draggedItem.index !== index) {
//         moveList(draggedItem.index, index);
//         draggedItem.index = index;
//       }
//     },
//   });

//   const [{ isDragging }, drag] = useDrag({
//     type: ItemTypes.LIST,
//     item: { index },
//     collect: (monitor) => ({
//       isDragging: monitor.isDragging(),
//     }),
//   });

//   drag(drop(ref));

//   return [ref, isDragging];
// };




// const List = ({ list, index, moveList, removeList, addCard, moveCard, updateCard }) => {
//   const listRef = useRef(null); // Create a ref for the list div

//   const [, drop] = useDrop({
//     accept: ItemTypes.CARD,
//     drop: (item) => {
//       if (item.fromListId !== list.id) {
//         moveCard(item.id, item.fromListId, list.id);
//       }
//     },
//   });

//   drop(listRef); // Attach drop to the list div

//   return (
//     <div ref={listRef} className="list">
//       <div className="list-header">
//         <h3 className="list-title">{list.title}</h3>
//         <button className="delete-list" onClick={() => removeList(list.id)}>X</button>
//       </div>
//       <div className="cards">
//         {list.cards.map((card) => (
//           <Card key={card.id} card={card} listId={list.id} moveCard={moveCard} updateCard={updateCard} />
//         ))}
//       </div>
//       <button className="add-card" onClick={() => addCard(list.id)}>+ Add a card</button>
//     </div>
//   );
// };





// const Card = ({ card, listId, moveCard, updateCard }) => {
//   const [{ isDragging }, drag] = useDrag({
//     type: ItemTypes.CARD,
//     item: { id: card.id, fromListId: listId },
//     collect: (monitor) => ({
//       isDragging: !!monitor.isDragging(),
//     }),
//   });

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editedCard, setEditedCard] = useState({
//     title: card.title,
//     description: card.description || "",
//     dueDate: card.dueDate || "",
//   });

//   const handleSave = () => {
//     updateCard(listId, card.id, editedCard);
//     setIsModalOpen(false);
//   };

//   return (
//     <>
//       <div ref={drag} className="card" style={{ opacity: isDragging ? 0.5 : 1 }} onClick={() => setIsModalOpen(true)}>
//         <p>{card.title}</p>
//         {card.dueDate && (
//           <div className="due-date">
//             <FaCalendarAlt className="calendar-icon" />
//             <span>{card.dueDate}</span>
//           </div>
//         )}
//       </div>

//       {isModalOpen && (
//         <div className="modal">
//           <div className="modal-content">
//             <h2>Edit Card</h2>
//             <label>Title:</label>
//             <input type="text" value={editedCard.title} onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })} />

//             <label>Description:</label>
//             <textarea value={editedCard.description} onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}></textarea>

//             <label>Due Date:</label>
//             <input type="date" value={editedCard.dueDate} onChange={(e) => setEditedCard({ ...editedCard, dueDate: e.target.value })} />

//             <div className="modal-actions">
//               <button onClick={() => setIsModalOpen(false)}>Close</button>
//               <button onClick={handleSave}>Save</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default App;



