import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const savedBoard = localStorage.getItem("trelloBoard");
    if (savedBoard) setLists(JSON.parse(savedBoard));
  }, []);

  useEffect(() => {
    localStorage.setItem("trelloBoard", JSON.stringify(lists));
  }, [lists]);

  // ✅ Fix: Define addCard inside the context
  const addCard = (listId) => {
    const title = prompt("Enter card title:");
    if (title) {
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? { ...list, cards: [...list.cards, { id: uuidv4(), title }] }
            : list
        )
      );
    }
  };

  return (
    <BoardContext.Provider value={{ lists, setLists, addCard }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => useContext(BoardContext);



// import { createContext, useContext, useState, useEffect } from "react";

// const BoardContext = createContext();

// export const BoardProvider = ({ children }) => {
//   const [lists, setLists] = useState([]);

//   useEffect(() => {
//     const savedBoard = localStorage.getItem("trelloBoard");
//     if (savedBoard) setLists(JSON.parse(savedBoard));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("trelloBoard", JSON.stringify(lists));
//   }, [lists]);

//   return (
//     <BoardContext.Provider value={{ lists, setLists }}>
//       {children}
//     </BoardContext.Provider>
//   );
// };

// export const useBoard = () => useContext(BoardContext);
